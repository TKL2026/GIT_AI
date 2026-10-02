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
import { ErpDataProvider } from "./erp-data-provider";

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);
  private engine: CopilotEngine | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataProvider: ErpDataProvider,
    private readonly prisma: PrismaService,
  ) {}

  async chat(organizationId: string, messages: ChatMessage[]): Promise<string> {
    const result = await this.runEngine(organizationId, (engine) =>
      engine.chat(organizationId, messages),
    );
    return result.message;
  }

  async generateDailyReport(organizationId: string): Promise<string> {
    const result = await this.runEngine(organizationId, (engine) =>
      engine.generateDailyReport(organizationId),
    );
    return result.message;
  }

  private async runEngine(
    organizationId: string,
    run: (engine: CopilotEngine) => Promise<ChatResult>,
  ): Promise<ChatResult> {
    const engine = this.getEngine();
    const startedAt = Date.now();
    const result = await run(engine);
    void this.logUsage(organizationId, result, Date.now() - startedAt);
    return result;
  }

  /**
   * Observabilité interne uniquement (coût moyen par client/plan,
   * répartition Haiku/Sonnet...) — jamais exposé aux utilisateurs. Ne doit
   * jamais faire échouer ni ralentir la réponse déjà renvoyée à
   * l'utilisateur : erreurs avalées et journalisées, pas de await en amont.
   */
  private async logUsage(
    organizationId: string,
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
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
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
