import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

const SANDBOX_BASE_URL = 'https://demo.campay.net';
const PRODUCTION_BASE_URL = 'https://www.campay.net';
// Marge de sécurité avant expiration réelle du token, pour ne jamais partir
// avec un token sur le point d'expirer en plein appel réseau.
const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

type CamPayAuth = { permanentToken: string } | { username: string; password: string };

interface CamPayConfig {
  baseUrl: string;
  webhookKey: string;
  auth: CamPayAuth;
}

export interface CamPayCollectParams {
  amount: number;
  currency: string;
  /** Format attendu par CamPay : indicatif sans "+", ex. "2376XXXXXXXX". */
  from: string;
  description: string;
  externalReference: string;
}

export interface CamPayCollectResult {
  reference: string;
  ussdCode: string | null;
  operator: string | null;
}

/** CamPay ne documente explicitement que PENDING/SUCCESSFUL — tout autre
 * statut (FAILED et variantes non confirmées) est traité comme un échec
 * par les appelants, sans dépendre d'une liste figée de chaînes exactes. */
export type CamPayTransactionStatus = 'PENDING' | 'SUCCESSFUL' | string;

export interface CamPayTransactionResult {
  reference: string;
  status: CamPayTransactionStatus;
  amount: string;
  currency: string;
  operator: string | null;
  operatorReference: string | null;
}

/**
 * Encapsule tout l'accès à l'API CamPay (auth, collecte, statut,
 * vérification de signature webhook) — aucun autre fichier du projet ne doit
 * appeler l'API CamPay directement.
 */
@Injectable()
export class CamPayService {
  private readonly logger = new Logger(CamPayService.name);
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly configService: ConfigService) {}

  async collect(params: CamPayCollectParams): Promise<CamPayCollectResult> {
    const { baseUrl } = this.getConfig();
    const token = await this.getToken();

    const response = await fetch(`${baseUrl}/api/collect/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        from: params.from,
        description: params.description,
        external_reference: params.externalReference,
      }),
    });

    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      this.logger.error(`Échec CamPay /collect/ (${response.status}) : ${JSON.stringify(json)}`);
      throw new BadGatewayException("Impossible d'initier le paiement auprès de CamPay.");
    }

    return {
      reference: String(json.reference),
      ussdCode: (json.ussd_code as string) ?? null,
      operator: (json.operator as string) ?? null,
    };
  }

  async getTransactionStatus(reference: string): Promise<CamPayTransactionResult> {
    const { baseUrl } = this.getConfig();
    const token = await this.getToken();

    const response = await fetch(`${baseUrl}/api/transaction/${encodeURIComponent(reference)}/`, {
      method: 'GET',
      headers: { Authorization: `Token ${token}` },
    });

    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      this.logger.error(`Échec CamPay /transaction/ (${response.status}) : ${JSON.stringify(json)}`);
      throw new BadGatewayException('Impossible de vérifier le statut du paiement auprès de CamPay.');
    }

    return {
      reference: String(json.reference),
      status: String(json.status) as CamPayTransactionStatus,
      amount: String(json.amount),
      currency: String(json.currency),
      operator: (json.operator as string) ?? null,
      operatorReference: (json.operator_reference as string) ?? null,
    };
  }

  /**
   * Le webhook CamPay transmet un champ `signature` qui est lui-même un JWT
   * signé avec la clé webhook du marchand — ce n'est pas un HMAC classique
   * en en-tête HTTP. Retourne false pour toute config manquante ou signature
   * invalide (jamais d'exception qui remonterait telle quelle au client).
   */
  verifyWebhookSignature(signature: string | undefined): boolean {
    if (!signature) {
      return false;
    }
    let webhookKey: string;
    try {
      webhookKey = this.getConfig().webhookKey;
    } catch {
      return false;
    }
    try {
      jwt.verify(signature, webhookKey);
      return true;
    } catch {
      return false;
    }
  }

  private async getToken(): Promise<string> {
    const { baseUrl, auth } = this.getConfig();

    // Le jeton permanent (dashboard CamPay > App Keys) n'expire jamais et
    // s'utilise directement dans l'en-tête Authorization — aucun appel
    // réseau ni mise en cache nécessaire, contrairement au flux
    // username/password ci-dessous.
    if ('permanentToken' in auth) {
      return auth.permanentToken;
    }

    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now) {
      return this.cachedToken.value;
    }

    const response = await fetch(`${baseUrl}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: auth.username, password: auth.password }),
    });

    const json = (await response.json().catch(() => ({}) as Record<string, unknown>)) as {
      token?: string;
      expires_in?: number;
    };
    if (!response.ok || !json.token) {
      this.logger.error(`Échec de l'authentification CamPay (${response.status}) : ${JSON.stringify(json)}`);
      throw new BadGatewayException("Impossible de s'authentifier auprès de CamPay.");
    }

    this.cachedToken = {
      value: json.token,
      expiresAt: now + Math.max((json.expires_in ?? 0) - TOKEN_EXPIRY_BUFFER_SECONDS, 0) * 1000,
    };
    return this.cachedToken.value;
  }

  private getConfig(): CamPayConfig {
    const env = this.configService.get<string>('CAMPAY_ENV');
    const webhookKey = this.configService.get<string>('CAMPAY_WEBHOOK_KEY');
    const permanentToken = this.configService.get<string>('CAMPAY_PERMANENT_TOKEN');
    const username = this.configService.get<string>('CAMPAY_USERNAME');
    const password = this.configService.get<string>('CAMPAY_PASSWORD');

    const auth: CamPayAuth | null = permanentToken
      ? { permanentToken }
      : username && password
        ? { username, password }
        : null;

    if (!env || !webhookKey || !auth) {
      throw new ServiceUnavailableException(
        "CamPay n'est pas configuré sur ce serveur (CAMPAY_ENV / CAMPAY_WEBHOOK_KEY manquants, et ni CAMPAY_PERMANENT_TOKEN ni CAMPAY_USERNAME+CAMPAY_PASSWORD ne sont renseignés).",
      );
    }

    const defaultBaseUrl = env === 'production' ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
    const baseUrl = this.configService.get<string>('CAMPAY_BASE_URL') || defaultBaseUrl;

    return { baseUrl, webhookKey, auth };
  }
}
