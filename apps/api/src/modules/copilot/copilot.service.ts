import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ChatMessage,
  ChatResult,
  CopilotEngine,
} from "@copilote/copilot-engine";
import { PrismaService } from "../../prisma/prisma.service";
import { CopilotQuotaService } from "../../common/entitlements/copilot-quota.service";
import { CopilotUserQuotaService } from "../../common/entitlements/copilot-user-quota.service";
import { ErpDataProvider } from "./erp-data-provider";
import { estimateCostUsd } from "./cost-estimation";
import { CopilotQuotaResponseDto } from "./dto/copilot-quota-response.dto";

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);
  private engine: CopilotEngine | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataProvider: ErpDataProvider,
    private readonly prisma: PrismaService,
    private readonly copilotQuotaService: CopilotQuotaService,
    private readonly copilotUserQuotaService: CopilotUserQuotaService,
  ) {}

  /**
   * Entoure l'appel au moteur d'un try/catch pour restituer l'unité de
   * quota réservée par CopilotQuotaGuard si l'appel échoue techniquement
   * (réseau, 5xx/timeout Anthropic, clé invalide...) — une telle panne ne
   * doit jamais être facturée à tort à l'utilisateur. Ne restitue JAMAIS
   * pour un refus de quota (déjà bloqué par le garde avant d'arriver ici,
   * donc cette méthode n'est même pas appelée dans ce cas).
   */
  async chat(
    organizationId: string,
    userId: string | null,
    usesPerUserQuota: boolean,
    messages: ChatMessage[],
  ): Promise<string> {
    const engine = this.getEngine();
    const startedAt = Date.now();
    let result: ChatResult;
    try {
      result = await engine.chat(organizationId, messages);
    } catch (error) {
      await this.releaseQuotaUnit(organizationId, userId, usesPerUserQuota);
      throw error;
    }
    void this.logUsage(organizationId, userId, result, Date.now() - startedAt);
    return result.message;
  }

  async generateDailyReport(
    organizationId: string,
    userId: string | null,
    usesPerUserQuota: boolean,
  ): Promise<string> {
    const engine = this.getEngine();
    const startedAt = Date.now();
    let result: ChatResult;
    try {
      result = await engine.generateDailyReport(organizationId);
    } catch (error) {
      await this.releaseQuotaUnit(organizationId, userId, usesPerUserQuota);
      throw error;
    }
    void this.logUsage(organizationId, userId, result, Date.now() - startedAt);
    return result.message;
  }

  private async releaseQuotaUnit(
    organizationId: string,
    userId: string | null,
    usesPerUserQuota: boolean,
  ): Promise<void> {
    try {
      if (usesPerUserQuota && userId) {
        await this.copilotUserQuotaService.releaseOne(userId);
      } else {
        await this.copilotQuotaService.releaseOne(organizationId);
      }
    } catch (releaseError) {
      this.logger.warn(`Échec de restitution du quota Copilot : ${releaseError}`);
    }
  }

  /** Snapshot du quota pour l'affichage frontend (GET /copilot/quota) —
   * jamais appelé derrière CopilotQuotaGuard (lecture seule, ne doit jamais
   * consommer d'unité). */
  async getQuotaSnapshot(
    organizationId: string,
    userId: string,
  ): Promise<CopilotQuotaResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      select: { status: true, copilotRequestsUsed: true },
    });

    if (subscription?.status === "LAUNCH_PROGRAM") {
      const { used, limit } = await this.copilotUserQuotaService.getUsage(userId);
      return { used, limit, remaining: Math.max(0, limit - used), isLaunchProgram: true };
    }

    const limit = await this.copilotQuotaService.getQuota(organizationId);
    const used = subscription?.copilotRequestsUsed ?? 0;
    return {
      used,
      limit,
      remaining: limit === null ? null : Math.max(0, limit - used),
      isLaunchProgram: false,
    };
  }

  /**
   * Observabilité interne uniquement (coût moyen par client/plan/utilisateur,
   * répartition Haiku/Sonnet...) — jamais exposé aux utilisateurs. Ne doit
   * jamais faire échouer ni ralentir la réponse déjà renvoyée à
   * l'utilisateur : erreurs avalées et journalisées, pas de await en amont.
   */
  private async logUsage(
    organizationId: string,
    userId: string | null,
    result: ChatResult,
    durationMs: number,
  ): Promise<void> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { organizationId },
        include: { plan: true },
      });

      await this.prisma.copilotUsageLog.create({
        data: {
          organizationId,
          userId,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          cacheCreationInputTokens: result.cacheCreationInputTokens,
          cacheReadInputTokens: result.cacheReadInputTokens,
          estimatedCostUsd: estimateCostUsd(result.model, result),
          durationMs,
          toolsUsed: result.toolsUsed,
          planCode: subscription?.plan?.code ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Échec d'écriture du log d'usage Copilot : ${error}`);
    }
  }

  /**
   * Construction paresseuse : une clé absente ne doit jamais empêcher le
   * reste de l'API (ERP) de démarrer, seulement faire échouer les routes
   * /copilot au moment de l'appel.
   */
  private getEngine(): CopilotEngine {
    if (!this.engine) {
      const apiKey = this.configService.get<string>("ANTHROPIC_API_KEY");
      if (!apiKey) {
        throw new ServiceUnavailableException(
          "Le copilote IA n'est pas configuré sur ce serveur (ANTHROPIC_API_KEY manquante).",
        );
      }
      const haikuModel = this.configService.get<string>(
        "ANTHROPIC_HAIKU_MODEL",
      );
      const sonnetModel = this.configService.get<string>(
        "ANTHROPIC_SONNET_MODEL",
      );
      this.engine = new CopilotEngine({
        apiKey,
        dataProvider: this.dataProvider,
        ...(haikuModel ? { haikuModel } : {}),
        ...(sonnetModel ? { sonnetModel } : {}),
      });
    }
    return this.engine;
  }
}
