import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, CopilotEngine } from '@copilote/copilot-engine';
import { ErpDataProvider } from './erp-data-provider';

@Injectable()
export class CopilotService {
  private engine: CopilotEngine | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataProvider: ErpDataProvider,
  ) {}

  chat(organizationId: string, messages: ChatMessage[]): Promise<string> {
    return this.getEngine().chat(organizationId, messages);
  }

  generateDailyReport(organizationId: string): Promise<string> {
    return this.getEngine().generateDailyReport(organizationId);
  }

  /**
   * Construction paresseuse : une clé absente ne doit jamais empêcher le
   * reste de l'API (ERP) de démarrer, seulement faire échouer les routes
   * /copilot au moment de l'appel.
   */
  private getEngine(): CopilotEngine {
    if (!this.engine) {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new ServiceUnavailableException(
          "Le copilote IA n'est pas configuré sur ce serveur (ANTHROPIC_API_KEY manquante).",
        );
      }
      this.engine = new CopilotEngine({ apiKey, dataProvider: this.dataProvider });
    }
    return this.engine;
  }
}
