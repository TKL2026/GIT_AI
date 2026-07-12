import Anthropic from '@anthropic-ai/sdk';
import { BusinessDataProvider } from './contracts/business-data-provider.interface';
import { DAILY_REPORT_PROMPT, SYSTEM_PROMPT } from './prompts';
import { COPILOT_TOOLS } from './tools';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Sous-ensemble de `Anthropic` utilisé par le moteur — permet d'injecter un double de test sans instancier un vrai client. */
export interface AnthropicMessagesClient {
  messages: {
    create: (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message>;
  };
}

export interface CopilotEngineOptions {
  dataProvider: BusinessDataProvider;
  apiKey?: string;
  client?: AnthropicMessagesClient;
  model?: string;
  maxToolIterations?: number;
}

const DEFAULT_MODEL = 'claude-sonnet-5';
const DEFAULT_MAX_TOOL_ITERATIONS = 6;
const DEFAULT_MAX_TOKENS = 2048;

export class CopilotEngine {
  private readonly client: AnthropicMessagesClient;
  private readonly dataProvider: BusinessDataProvider;
  private readonly model: string;
  private readonly maxToolIterations: number;

  constructor(options: CopilotEngineOptions) {
    if (!options.client && !options.apiKey) {
      throw new Error('CopilotEngine requiert soit un `client`, soit un `apiKey`.');
    }
    this.client = options.client ?? new Anthropic({ apiKey: options.apiKey });
    this.dataProvider = options.dataProvider;
    this.model = options.model ?? DEFAULT_MODEL;
    this.maxToolIterations = options.maxToolIterations ?? DEFAULT_MAX_TOOL_ITERATIONS;
  }

  async chat(tenantId: string, messages: ChatMessage[]): Promise<string> {
    const conversation: Anthropic.MessageParam[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    for (let iteration = 0; iteration < this.maxToolIterations; iteration += 1) {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: DEFAULT_MAX_TOKENS,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        tools: COPILOT_TOOLS,
        output_config: { effort: 'medium' },
        messages: conversation,
      });

      if (response.stop_reason !== 'tool_use') {
        return extractText(response);
      }

      conversation.push({ role: 'assistant', content: response.content });

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await this.executeTool(tenantId, block.name, block.input);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }

      conversation.push({ role: 'user', content: toolResults });
    }

    throw new Error("Le copilote n'a pas pu conclure dans le nombre d'itérations d'outils autorisé.");
  }

  async generateDailyReport(tenantId: string): Promise<string> {
    return this.chat(tenantId, [{ role: 'user', content: DAILY_REPORT_PROMPT }]);
  }

  private async executeTool(tenantId: string, name: string, input: unknown): Promise<string> {
    const params = (input ?? {}) as Record<string, unknown>;
    const from = typeof params.from === 'string' ? params.from : undefined;
    const to = typeof params.to === 'string' ? params.to : undefined;

    switch (name) {
      case 'get_finance_summary':
        return JSON.stringify(await this.dataProvider.getFinanceSummary(tenantId, from, to));
      case 'get_products_profitability':
        return JSON.stringify(await this.dataProvider.getProductsProfitability(tenantId, from, to));
      case 'get_stock_alerts':
        return JSON.stringify(await this.dataProvider.getStockAlerts(tenantId));
      case 'get_products':
        return JSON.stringify(await this.dataProvider.getProducts(tenantId));
      case 'get_recent_sales': {
        const limit = typeof params.limit === 'number' ? params.limit : undefined;
        return JSON.stringify(await this.dataProvider.getRecentSales(tenantId, limit));
      }
      case 'get_pending_purchase_orders':
        return JSON.stringify(await this.dataProvider.getPendingPurchaseOrders(tenantId));
      case 'get_suppliers':
        return JSON.stringify(await this.dataProvider.getSuppliers(tenantId));
      case 'get_replenishment_forecast':
        return JSON.stringify(await this.dataProvider.getReplenishmentForecast(tenantId));
      default:
        return JSON.stringify({ error: `Outil inconnu: ${name}` });
    }
  }
}

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}
