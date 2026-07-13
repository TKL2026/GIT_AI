import { PurchaseOrderStatus } from '@prisma/client';
import { CommercialService } from '../commercial/commercial.service';
import { FinanceService } from '../finance/finance.service';
import { ForecastService } from '../forecast/forecast.service';
import { FraudService } from '../fraud/fraud.service';
import { ProductsService } from '../products/products.service';
import { PurchaseOrdersService } from '../purchases/purchase-orders.service';
import { SalesService } from '../sales/sales.service';
import { StockService } from '../stock/stock.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { ErpDataProvider } from './erp-data-provider';

describe('ErpDataProvider', () => {
  const organizationId = 'org-1';

  let productsService: { findAll: jest.Mock };
  let stockService: { findAlerts: jest.Mock };
  let salesService: { findAll: jest.Mock };
  let purchaseOrdersService: { findAll: jest.Mock };
  let suppliersService: { findAll: jest.Mock };
  let financeService: {
    getSummary: jest.Mock;
    getProductsProfitability: jest.Mock;
    getMonthlyTrend: jest.Mock;
  };
  let forecastService: { getReplenishmentForecast: jest.Mock };
  let fraudService: { getAnomalies: jest.Mock };
  let commercialService: {
    getProductsToPush: jest.Mock;
    getCustomerInsights: jest.Mock;
    getCrossSellOpportunities: jest.Mock;
  };
  let provider: ErpDataProvider;

  const buildProduct = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'prod-1',
    organizationId,
    name: 'Riz 25kg',
    sku: 'RIZ-25KG',
    purchasePrice: 12000,
    salePrice: 15000,
    stockQuantity: 3,
    minStock: 5,
    maxStock: null,
    createdAt: new Date('2026-07-01'),
    ...overrides,
  });

  beforeEach(() => {
    productsService = { findAll: jest.fn() };
    stockService = { findAlerts: jest.fn() };
    salesService = { findAll: jest.fn() };
    purchaseOrdersService = { findAll: jest.fn() };
    suppliersService = { findAll: jest.fn() };
    financeService = {
      getSummary: jest.fn(),
      getProductsProfitability: jest.fn(),
      getMonthlyTrend: jest.fn(),
    };
    forecastService = { getReplenishmentForecast: jest.fn() };
    fraudService = { getAnomalies: jest.fn() };
    commercialService = {
      getProductsToPush: jest.fn(),
      getCustomerInsights: jest.fn(),
      getCrossSellOpportunities: jest.fn(),
    };

    provider = new ErpDataProvider(
      productsService as unknown as ProductsService,
      stockService as unknown as StockService,
      salesService as unknown as SalesService,
      purchaseOrdersService as unknown as PurchaseOrdersService,
      suppliersService as unknown as SuppliersService,
      financeService as unknown as FinanceService,
      forecastService as unknown as ForecastService,
      fraudService as unknown as FraudService,
      commercialService as unknown as CommercialService,
    );
  });

  it('transmet tenantId à CommercialService.getProductsToPush', async () => {
    const products = [
      { productId: 'p1', productName: 'Riz', marginPerUnit: 3000, stockQuantity: 10, description: '...' },
    ];
    commercialService.getProductsToPush.mockResolvedValue(products);

    const result = await provider.getProductsToPush(organizationId);

    expect(commercialService.getProductsToPush).toHaveBeenCalledWith(organizationId);
    expect(result).toEqual(products);
  });

  it('transmet tenantId/limit à CommercialService.getCustomerInsights', async () => {
    const customers = [
      { customerLabel: '+225000', totalSpent: 15000, purchaseCount: 2, lastPurchaseAt: '2026-07-05', daysSinceLastPurchase: 5 },
    ];
    commercialService.getCustomerInsights.mockResolvedValue(customers);

    const result = await provider.getCustomerInsights(organizationId, 5);

    expect(commercialService.getCustomerInsights).toHaveBeenCalledWith(organizationId, 5);
    expect(result).toEqual(customers);
  });

  it('transmet tenantId/limit à CommercialService.getCrossSellOpportunities', async () => {
    const pairs = [
      { productAId: 'p1', productAName: 'Riz', productBId: 'p2', productBName: 'Huile', coOccurrenceCount: 3 },
    ];
    commercialService.getCrossSellOpportunities.mockResolvedValue(pairs);

    const result = await provider.getCrossSellOpportunities(organizationId, 3);

    expect(commercialService.getCrossSellOpportunities).toHaveBeenCalledWith(organizationId, 3);
    expect(result).toEqual(pairs);
  });

  it('transmet tenantId/monthsBack à FinanceService.getMonthlyTrend', async () => {
    const trend = [
      {
        month: '2026-06',
        totalRevenue: 100000,
        totalExpenses: 20000,
        totalCogs: 40000,
        grossMargin: 60000,
        netProfit: 40000,
        salesCount: 5,
        grossMarginRatio: 0.6,
        netMarginRatio: 0.4,
        revenueGrowthRatio: null,
      },
    ];
    financeService.getMonthlyTrend.mockResolvedValue(trend);

    const result = await provider.getMonthlyFinanceTrend(organizationId, 3);

    expect(financeService.getMonthlyTrend).toHaveBeenCalledWith(organizationId, 3);
    expect(result).toEqual(trend);
  });

  it('transmet tenantId/from/to à FinanceService.getSummary', async () => {
    const summary = {
      totalRevenue: 100,
      totalExpenses: 20,
      totalCogs: 40,
      grossMargin: 60,
      netProfit: 40,
      salesCount: 2,
    };
    financeService.getSummary.mockResolvedValue(summary);

    const result = await provider.getFinanceSummary(organizationId, '2026-07-01', '2026-07-31');

    expect(financeService.getSummary).toHaveBeenCalledWith(organizationId, '2026-07-01', '2026-07-31');
    expect(result).toEqual(summary);
  });

  it('transmet tenantId à ForecastService.getReplenishmentForecast', async () => {
    const forecast = [
      {
        productId: 'prod-1',
        productName: 'Riz 25kg',
        currentStock: 3,
        averageDailySales: 1,
        daysUntilStockout: 3,
        recommendedReorderQuantity: 27,
      },
    ];
    forecastService.getReplenishmentForecast.mockResolvedValue(forecast);

    const result = await provider.getReplenishmentForecast(organizationId);

    expect(forecastService.getReplenishmentForecast).toHaveBeenCalledWith(organizationId);
    expect(result).toEqual(forecast);
  });

  it('transmet tenantId à FraudService.getAnomalies', async () => {
    const anomalies = [
      {
        type: 'unexplained_stock_adjustment',
        severity: 'high',
        productId: 'prod-1',
        productName: 'Riz 25kg',
        performedByUserId: 'user-1',
        occurrencesCount: 2,
        totalImpact: 12,
        description: '2 ajustement(s)...',
      },
    ];
    fraudService.getAnomalies.mockResolvedValue(anomalies);

    const result = await provider.getFraudAnomalies(organizationId);

    expect(fraudService.getAnomalies).toHaveBeenCalledWith(organizationId);
    expect(result).toEqual(anomalies);
  });

  it('normalise les produits en alerte de stock', async () => {
    stockService.findAlerts.mockResolvedValue([buildProduct()]);

    const result = await provider.getStockAlerts(organizationId);

    expect(stockService.findAlerts).toHaveBeenCalledWith(organizationId);
    expect(result).toEqual([
      {
        id: 'prod-1',
        name: 'Riz 25kg',
        sku: 'RIZ-25KG',
        purchasePrice: 12000,
        salePrice: 15000,
        stockQuantity: 3,
        minStock: 5,
        maxStock: null,
      },
    ]);
  });

  it('limite get_recent_sales à 20 par défaut et jamais plus de 50', async () => {
    salesService.findAll.mockResolvedValue(
      Array.from({ length: 60 }, (_, i) => ({
        id: `sale-${i}`,
        organizationId,
        performedByUserId: 'user-1',
        customerName: null,
        customerPhone: null,
        paymentMethod: 'CASH',
        totalAmount: 1000,
        createdAt: new Date('2026-07-01'),
        items: [],
      })),
    );

    const withDefault = await provider.getRecentSales(organizationId);
    expect(withDefault).toHaveLength(20);

    const withOversizedLimit = await provider.getRecentSales(organizationId, 500);
    expect(withOversizedLimit).toHaveLength(50);
  });

  it('ne garde que les commandes fournisseurs en attente', async () => {
    purchaseOrdersService.findAll.mockResolvedValue([
      {
        id: 'po-1',
        organizationId,
        supplierId: 'sup-1',
        supplier: { id: 'sup-1', name: 'Fournisseur A' },
        performedByUserId: 'user-1',
        status: PurchaseOrderStatus.PENDING,
        totalAmount: 5000,
        createdAt: new Date('2026-07-01'),
        receivedAt: null,
        items: [],
      },
      {
        id: 'po-2',
        organizationId,
        supplierId: 'sup-1',
        supplier: { id: 'sup-1', name: 'Fournisseur A' },
        performedByUserId: 'user-1',
        status: PurchaseOrderStatus.RECEIVED,
        totalAmount: 3000,
        createdAt: new Date('2026-06-01'),
        receivedAt: new Date('2026-06-05'),
        items: [],
      },
    ]);

    const result = await provider.getPendingPurchaseOrders(organizationId);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('po-1');
    expect(result[0].status).toBe(PurchaseOrderStatus.PENDING);
  });

  it('normalise les fournisseurs', async () => {
    suppliersService.findAll.mockResolvedValue([
      {
        id: 'sup-1',
        organizationId,
        name: 'Fournisseur A',
        contactName: 'Jean',
        phone: '+225000000',
        email: null,
        address: null,
        createdAt: new Date('2026-07-01'),
      },
    ]);

    const result = await provider.getSuppliers(organizationId);

    expect(result).toEqual([
      { id: 'sup-1', name: 'Fournisseur A', contactName: 'Jean', phone: '+225000000', email: null },
    ]);
  });
});
