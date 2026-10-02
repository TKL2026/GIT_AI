import { plainToInstance } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from "class-validator";

class EnvironmentVariables {
  @IsIn(["development", "production", "test"])
  NODE_ENV: string = "development";

  @IsInt()
  PORT: number = 3000;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(16)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string = "15m";

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = "7d";

  @IsString()
  CORS_ORIGIN: string = "http://localhost:5173";

  /** Optionnel : sans clé, l'app démarre normalement, seules les routes /copilot répondent 503. */
  @IsOptional()
  @IsString()
  ANTHROPIC_API_KEY?: string;

  /** Optionnel : modèle Anthropic utilisé pour les requêtes Copilot classées
   * "simples" par le routeur (voir model-router.ts). Sans valeur, le moteur
   * utilise son propre défaut (claude-haiku-4-5-20251001). */
  @IsOptional()
  @IsString()
  ANTHROPIC_HAIKU_MODEL?: string;

  /** Optionnel : modèle Anthropic utilisé pour les requêtes Copilot classées
   * "complexes" (et par défaut en cas d'ambiguïté). Sans valeur, le moteur
   * utilise son propre défaut (claude-sonnet-5). */
  @IsOptional()
  @IsString()
  ANTHROPIC_SONNET_MODEL?: string;

  /** Optionnel : sans clé, les emails (reset mot de passe, invitations) sont
   * seulement journalisés côté serveur au lieu d'être envoyés. */
  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  MAIL_FROM?: string;

  /** Optionnel : sans DSN, l'app démarre normalement, Sentry reste simplement inactif. */
  @IsOptional()
  @IsString()
  SENTRY_DSN?: string;

  /** Optionnel : sans ces variables, l'app démarre normalement, seules les routes /whatsapp répondent 503. */
  @IsOptional()
  @IsString()
  WHATSAPP_ACCESS_TOKEN?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_PHONE_NUMBER_ID?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_NOTIFICATION_RECIPIENT?: string;

  /** Optionnel : sans ces variables, le webhook /whatsapp/webhook répond 503/403. */
  @IsOptional()
  @IsString()
  WHATSAPP_WEBHOOK_VERIFY_TOKEN?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_APP_SECRET?: string;

  @IsOptional()
  @IsString()
  WHATSAPP_INBOUND_ORGANIZATION_ID?: string;

  /** Optionnel : désactivé par défaut. Ne jamais activer en production durable — accès sans mot de passe au compte démo, réservé aux audits temporaires. */
  @IsOptional()
  @IsString()
  DEMO_MODE_ENABLED?: string;

  @IsOptional()
  @IsString()
  DEMO_USER_EMAIL?: string;

  /** Optionnel : sans ces variables, les routes /billing/checkout et le
   * webhook CamPay répondent 503. Ne jamais mélanger sandbox/production. */
  @IsOptional()
  @IsIn(["sandbox", "production"])
  CAMPAY_ENV?: string;

  /** Méthode d'authentification CamPay recommandée : un jeton qui n'expire
   * jamais (dashboard CamPay > App Keys), utilisé directement sans échange
   * préalable. Si absent, on retombe sur CAMPAY_USERNAME/CAMPAY_PASSWORD. */
  @IsOptional()
  @IsString()
  CAMPAY_PERMANENT_TOKEN?: string;

  /** Identifiant affiché dans le dashboard CamPay — jamais transmis dans les
   * appels API, conservé ici uniquement pour référence/débogage. */
  @IsOptional()
  @IsString()
  CAMPAY_ID?: string;

  @IsOptional()
  @IsString()
  CAMPAY_USERNAME?: string;

  @IsOptional()
  @IsString()
  CAMPAY_PASSWORD?: string;

  @IsOptional()
  @IsString()
  CAMPAY_WEBHOOK_KEY?: string;

  /** Optionnel : surcharge l'URL de base déduite de CAMPAY_ENV (utile pour tester). */
  @IsOptional()
  @IsString()
  CAMPAY_BASE_URL?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Configuration invalide:\n${errors
        .map((e) => Object.values(e.constraints ?? {}).join(", "))
        .join("\n")}`,
    );
  }
  return validatedConfig;
}
