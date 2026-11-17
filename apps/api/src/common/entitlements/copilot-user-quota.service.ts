import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

export const DEFAULT_LAUNCH_PROGRAM_COPILOT_QUOTA = 700;

export interface CopilotUserQuotaConsumption {
  allowed: boolean;
  limit: number;
}

/**
 * Quota Copilot mensuel PAR UTILISATEUR, réservé aux organisations en
 * LAUNCH_PROGRAM (voir copilot-quota.guard.ts pour le choix du mécanisme —
 * les organisations ACTIVE/TRIAL continuent d'utiliser CopilotQuotaService,
 * inchangé). Mois calendaire UTC ("YYYY-MM") — la ligne du mois est créée
 * paresseusement à la première requête, aucun job de réinitialisation.
 */
@Injectable()
export class CopilotUserQuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getLimit(): number {
    const raw = this.configService.get<string>("LAUNCH_PROGRAM_COPILOT_QUOTA");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_LAUNCH_PROGRAM_COPILOT_QUOTA;
  }

  private currentPeriodKey(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  /**
   * Réserve atomiquement une unité pour le mois courant. Deux temps,
   * cohérent avec le reste du code base (updateMany conditionné, jamais de
   * lecture-puis-écriture séparées) :
   * 1) upsert "création si absent, no-op sinon" pour garantir que la ligne
   *    du mois existe avant la réservation ;
   * 2) CAS updateMany comme CopilotQuotaService#consumeOne /
   *    AuthService#verifyLoginCode, sur (userId, periodKey, requestsUsed < limit).
   */
  async consumeOne(userId: string): Promise<CopilotUserQuotaConsumption> {
    const limit = this.getLimit();
    const periodKey = this.currentPeriodKey();

    await this.prisma.copilotUserUsage.upsert({
      where: { userId_periodKey: { userId, periodKey } },
      create: { userId, periodKey, requestsUsed: 0 },
      update: {},
    });

    const result = await this.prisma.copilotUserUsage.updateMany({
      where: { userId, periodKey, requestsUsed: { lt: limit } },
      data: { requestsUsed: { increment: 1 } },
    });

    return { allowed: result.count === 1, limit };
  }

  /**
   * Compense un consumeOne() dont l'appel Anthropic a techniquement échoué
   * (voir CopilotService#chat) — jamais appelé pour un refus de quota
   * (consumeOne a déjà renvoyé allowed:false, rien à compenser). Garde
   * `requestsUsed: { gt: 0 }` : ne peut jamais faire passer le compteur sous
   * zéro même en cas de double appel.
   */
  async releaseOne(userId: string): Promise<void> {
    const periodKey = this.currentPeriodKey();
    await this.prisma.copilotUserUsage.updateMany({
      where: { userId, periodKey, requestsUsed: { gt: 0 } },
      data: { requestsUsed: { decrement: 1 } },
    });
  }

  /** Pour l'affichage frontend (GET /copilot/quota) — lecture seule, ne crée
   * pas de ligne si elle n'existe pas encore (0 utilisé par défaut). */
  async getUsage(userId: string): Promise<{ used: number; limit: number }> {
    const limit = this.getLimit();
    const periodKey = this.currentPeriodKey();
    const row = await this.prisma.copilotUserUsage.findUnique({
      where: { userId_periodKey: { userId, periodKey } },
    });
    return { used: row?.requestsUsed ?? 0, limit };
  }
}
