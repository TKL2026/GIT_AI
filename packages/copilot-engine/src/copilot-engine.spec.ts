import Anthropic from '@anthropic-ai/sdk';
import { BusinessDataProvider } from './contracts/business-data-provider.interface';
import { AnthropicMessagesClient, CopilotEngine } from './copilot-engine';

function textMessage(text: string): Anthropic.Message {
  return {
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 } as Anthropic.Usage,
    content: [{ type: 'text', text, citations: [] } as Anthropic.TextBlock],
  } as Anthropic.Message;
}

function toolUseMessage(toolName: string, input: unknown, id = 'tool_1'): Anthropic.Message {
  return {
    id: 'msg_tool',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5',
    stop_reason: 'tool_use',
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 } as Anthropic.Usage,
    content: [{ type: 'tool_use', id, name: toolName, input } as Anthropic.ToolUseBlock],
  } as Anthropic.Message;
}

function buildDataProvider(overrides: Partial<BusinessDataProvider> = {}): jest.Mocked<BusinessDataProvider> {
  return {
    getFinanceSummary: jest.fn(),
    getProductsProfitability: jest.fn(),
    getStockAlerts: jest.fn(),
    getProducts: jest.fn(),
    getRecentSales: jest.fn(),
    getPendingPurchaseOrders: jest.fn(),
    getSuppliers: jest.fn(),
    getReplenishmentForecast: jest.fn(),
    getFraudAnomalies: jest.fn(),
    ...overrides,
  } as jest.Mocked<BusinessDataProvider>;
}

describe('CopilotEngine', () => {
  it("retourne directement le texte quand Claude conclut sans appeler d'outil", async () => {
    const create = jest.fn().mockResolvedValue(textMessage('Bonjour, tout va bien.'));
    const client: AnthropicMessagesClient = { messages: { create } };
    const dataProvider = buildDataProvider();

    const engine = new CopilotEngine({ client, dataProvider });
    const reply = await engine.chat('org-1', [{ role: 'user', content: 'Comment ça va ?' }]);

    expect(reply).toBe('Bonjour, tout va bien.');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('route un tool_use vers la méthode du data provider correspondante avec le tenantId du contexte', async () => {
    const stockAlerts = [{ id: 'p1', name: 'Riz', sku: 'RIZ', purchasePrice: 1, salePrice: 2, stockQuantity: 1, minStock: 5, maxStock: null }];
    const create = jest
      .fn()
      .mockResolvedValueOnce(toolUseMessage('get_stock_alerts', {}))
      .mockResolvedValueOnce(textMessage('Un produit est en rupture : Riz.'));
    const client: AnthropicMessagesClient = { messages: { create } };
    const dataProvider = buildDataProvider({ getStockAlerts: jest.fn().mockResolvedValue(stockAlerts) });

    const engine = new CopilotEngine({ client, dataProvider });
    const reply = await engine.chat('org-real-tenant', [{ role: 'user', content: 'Y a-t-il des ruptures ?' }]);

    expect(dataProvider.getStockAlerts).toHaveBeenCalledWith('org-real-tenant');
    expect(reply).toBe('Un produit est en rupture : Riz.');
  });

  it("ignore un organizationId injecté dans l'input du tool_use et utilise toujours le tenantId authentifié", async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce(toolUseMessage('get_finance_summary', { organizationId: 'org-attacker', from: '2026-01-01' }))
      .mockResolvedValueOnce(textMessage('Résumé transmis.'));
    const client: AnthropicMessagesClient = { messages: { create } };
    const dataProvider = buildDataProvider({
      getFinanceSummary: jest.fn().mockResolvedValue({
        totalRevenue: 0,
        totalExpenses: 0,
        totalCogs: 0,
        grossMargin: 0,
        netProfit: 0,
        salesCount: 0,
      }),
    });

    const engine = new CopilotEngine({ client, dataProvider });
    await engine.chat('org-legit-tenant', [{ role: 'user', content: 'Résumé finance ?' }]);

    expect(dataProvider.getFinanceSummary).toHaveBeenCalledWith('org-legit-tenant', '2026-01-01', undefined);
  });

  it('route get_replenishment_forecast vers dataProvider.getReplenishmentForecast', async () => {
    const forecast = [
      {
        productId: 'p1',
        productName: 'Riz 25kg',
        currentStock: 4,
        averageDailySales: 2,
        daysUntilStockout: 2,
        recommendedReorderQuantity: 56,
      },
    ];
    const create = jest
      .fn()
      .mockResolvedValueOnce(toolUseMessage('get_replenishment_forecast', {}))
      .mockResolvedValueOnce(textMessage('Réapprovisionnez le riz sous 2 jours.'));
    const client: AnthropicMessagesClient = { messages: { create } };
    const dataProvider = buildDataProvider({
      getReplenishmentForecast: jest.fn().mockResolvedValue(forecast),
    });

    const engine = new CopilotEngine({ client, dataProvider });
    const reply = await engine.chat('org-1', [{ role: 'user', content: 'Que dois-je recommander bientôt ?' }]);

    expect(dataProvider.getReplenishmentForecast).toHaveBeenCalledWith('org-1');
    expect(reply).toBe('Réapprovisionnez le riz sous 2 jours.');
  });

  it('route get_fraud_anomalies vers dataProvider.getFraudAnomalies', async () => {
    const anomalies = [
      {
        type: 'unexplained_stock_adjustment' as const,
        severity: 'high' as const,
        productId: 'p1',
        productName: 'Riz 25kg',
        performedByUserId: 'user-1',
        occurrencesCount: 2,
        totalImpact: 12,
        description: '2 ajustement(s) de stock à la baisse sans motif renseigné, totalisant 12 unité(s).',
      },
    ];
    const create = jest
      .fn()
      .mockResolvedValueOnce(toolUseMessage('get_fraud_anomalies', {}))
      .mockResolvedValueOnce(textMessage('Un signal à vérifier sur le riz.'));
    const client: AnthropicMessagesClient = { messages: { create } };
    const dataProvider = buildDataProvider({
      getFraudAnomalies: jest.fn().mockResolvedValue(anomalies),
    });

    const engine = new CopilotEngine({ client, dataProvider });
    const reply = await engine.chat('org-1', [{ role: 'user', content: 'Y a-t-il des anomalies suspectes ?' }]);

    expect(dataProvider.getFraudAnomalies).toHaveBeenCalledWith('org-1');
    expect(reply).toBe('Un signal à vérifier sur le riz.');
  });

  it("s'arrête avec une erreur explicite si le nombre d'itérations d'outils dépasse la limite", async () => {
    const create = jest.fn().mockResolvedValue(toolUseMessage('get_products', {}));
    const client: AnthropicMessagesClient = { messages: { create } };
    const dataProvider = buildDataProvider({ getProducts: jest.fn().mockResolvedValue([]) });

    const engine = new CopilotEngine({ client, dataProvider, maxToolIterations: 3 });

    await expect(engine.chat('org-1', [{ role: 'user', content: 'Boucle infinie ?' }])).rejects.toThrow(
      /itérations d'outils autorisé/,
    );
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('lève une erreur si ni client ni apiKey ne sont fournis', () => {
    const dataProvider = buildDataProvider();
    expect(() => new CopilotEngine({ dataProvider } as never)).toThrow(/client.*apiKey/);
  });
});
