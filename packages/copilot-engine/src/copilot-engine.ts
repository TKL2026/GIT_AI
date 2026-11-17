import Anthropic from '@anthropic-ai/sdk';
import { BusinessDataProvider } from './contracts/business-data-provider.interface';
import { classifyComplexity } from './model-router';
import { SYSTEM_PROMPT } from './prompts';
import { COPILOT_TOOLS } from './tools';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Résultat enrichi d'un échange — au-delà du texte, porte les métadonnées
 * nécessaires à l'observabilité des coûts (voir CopilotService), sans jamais
 * inclure le contenu de la conversation elle-même. */
export interface ChatResult {
  message: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Tokens d'écriture/lecture du cache de prompt Anthropic — nécessaires
   * pour un coût estimé exact (le cache-read coûte ~10x moins cher qu'un
   * token d'entrée standard). */
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  toolsUsed: string[];
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
  /** Modèle utilisé pour les requêtes classées "simples" par le routeur. */
  haikuModel?: string;
  /** Modèle utilisé pour les requêtes classées "complexes" par le routeur,
   * et par défaut pour toute requête ambiguë (biais de sécurité). */
  sonnetModel?: string;
  maxToolIterations?: number;
}

const DEFAULT_HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_SONNET_MODEL = 'claude-sonnet-5';
const DEFAULT_MAX_TOOL_ITERATIONS = 6;
// Haiku ne pense jamais (modèle pré-4.6, pas de thinking adaptatif par
// défaut) : les réponses de lookup ERP simple restent courtes.
const HAIKU_MAX_TOKENS = 1536;
// Sonnet 5 active le thinking adaptatif par défaut dès que `thinking` est
// omis, et les tokens de réflexion sont facturés comme tokens de sortie
// PARTAGEANT le même budget max_tokens que la réponse visible — un budget
// dimensionné pour un simple lookup tronquerait silencieusement la réponse
// sur les requêtes complexes. On réserve donc davantage de marge et on
// déclare `thinking` explicitement (voir plus bas) plutôt que de compter
// sur le défaut implicite, moins lisible et plus fragile si l'API change.
const SONNET_MAX_TOKENS = 4096;

export class CopilotEngine {
  private readonly client: AnthropicMessagesClient;
  private readonly dataProvider: BusinessDataProvider;
  private readonly haikuModel: string;
  private readonly sonnetModel: string;
  private readonly maxToolIterations: number;

  constructor(options: CopilotEngineOptions) {
    if (!options.client && !options.apiKey) {
      throw new Error('CopilotEngine requiert soit un `client`, soit un `apiKey`.');
    }
    this.client = options.client ?? new Anthropic({ apiKey: options.apiKey });
    this.dataProvider = options.dataProvider;
    this.haikuModel = options.haikuModel ?? DEFAULT_HAIKU_MODEL;
    this.sonnetModel = options.sonnetModel ?? DEFAULT_SONNET_MODEL;
    this.maxToolIterations = options.maxToolIterations ?? DEFAULT_MAX_TOOL_ITERATIONS;
  }

  async chat(tenantId: string, messages: ChatMessage[]): Promise<ChatResult> {
    const conversation: Anthropic.MessageParam[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // Routage décidé une seule fois, sur le dernier message utilisateur de
    // la conversation reçue — jamais réévalué pendant la boucle d'outils,
    // pour ne pas changer de modèle en cours de réponse.
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const tier = classifyComplexity(lastUserMessage?.content ?? '');
    const model = tier === 'simple' ? this.haikuModel : this.sonnetModel;

    let inputTokens = 0;
    let outputTokens = 0;
    let cacheCreationInputTokens = 0;
    let cacheReadInputTokens = 0;
    const toolsUsed = new Set<string>();

    for (let iteration = 0; iteration < this.maxToolIterations; iteration += 1) {
      const response = await this.client.messages.create({
        model,
        max_tokens: tier === 'simple' ? HAIKU_MAX_TOKENS : SONNET_MAX_TOKENS,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        tools: COPILOT_TOOLS,
        // Jamais appliqué au tiers Haiku (modèle pré-4.6, non concerné par
        // le thinking adaptatif ni par `effort`, qui y renvoie une erreur) :
        // thinking déclaré explicitement + effort modéré sur Sonnet.
        ...(tier === 'complex'
          ? { thinking: { type: 'adaptive' as const }, output_config: { effort: 'medium' as const } }
          : {}),
        messages: conversation,
      });

      inputTokens += response.usage?.input_tokens ?? 0;
      outputTokens += response.usage?.output_tokens ?? 0;
      cacheCreationInputTokens += response.usage?.cache_creation_input_tokens ?? 0;
      cacheReadInputTokens += response.usage?.cache_read_input_tokens ?? 0;

      if (response.stop_reason !== 'tool_use') {
        return {
          message: extractText(response),
          model,
          inputTokens,
          outputTokens,
          cacheCreationInputTokens,
          cacheReadInputTokens,
          toolsUsed: [...toolsUsed],
        };
      }

      conversation.push({ role: 'assistant', content: response.content });

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        toolsUsed.add(block.name);
        const result = await this.executeTool(tenantId, block.name, block.input);
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
      }

      conversation.push({ role: 'user', content: toolResults });
    }

    throw new Error("Le copilote n'a pas pu conclure dans le nombre d'itérations d'outils autorisé.");
  }

  private async executeTool(tenantId: string, name: string, input: unknown): Promise<string> {
    const params = (input ?? {}) as Record<string, unknown>;
    const from = typeof params.from === 'string' ? params.from : undefined;
    const to = typeof params.to === 'string' ? params.to : undefined;
    const limit = typeof params.limit === 'number' ? params.limit : undefined;

    switch (name) {
      case 'get_finance_summary':
        return JSON.stringify(await this.dataProvider.getFinanceSummary(tenantId, from, to));
      case 'get_products_profitability':
        return JSON.stringify(await this.dataProvider.getProductsProfitability(tenantId, from, to));
      case 'get_stock_alerts':
        return JSON.stringify(await this.dataProvider.getStockAlerts(tenantId, limit));
      case 'get_products':
        return JSON.stringify(await this.dataProvider.getProducts(tenantId, limit));
      case 'get_recent_sales':
        return JSON.stringify(await this.dataProvider.getRecentSales(tenantId, limit));
      case 'get_pending_purchase_orders':
        return JSON.stringify(await this.dataProvider.getPendingPurchaseOrders(tenantId, limit));
      case 'get_suppliers':
        return JSON.stringify(await this.dataProvider.getSuppliers(tenantId, limit));
      case 'get_replenishment_forecast':
        return JSON.stringify(await this.dataProvider.getReplenishmentForecast(tenantId, limit));
      case 'get_fraud_anomalies':
        return JSON.stringify(await this.dataProvider.getFraudAnomalies(tenantId));
      case 'get_monthly_finance_trend': {
        const months = typeof params.months === 'number' ? params.months : undefined;
        return JSON.stringify(await this.dataProvider.getMonthlyFinanceTrend(tenantId, months));
      }
      case 'get_products_to_push':
        return JSON.stringify(await this.dataProvider.getProductsToPush(tenantId));
      case 'get_customer_insights':
        return JSON.stringify(await this.dataProvider.getCustomerInsights(tenantId, limit));
      case 'get_cross_sell_opportunities':
        return JSON.stringify(await this.dataProvider.getCrossSellOpportunities(tenantId, limit));
      case 'get_purchase_recommendations':
        return JSON.stringify(await this.dataProvider.getPurchaseRecommendations(tenantId, limit));
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
