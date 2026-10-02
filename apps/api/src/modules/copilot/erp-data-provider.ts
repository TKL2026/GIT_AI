import { Injectable } from "@nestjs/common";
import { PurchaseOrderStatus } from "@prisma/client";
import {
  BusinessDataProvider,
  NormalizedCrossSellPair,
  NormalizedCustomerInsight,
  NormalizedFinanceSummary,
  NormalizedFraudAnomaly,
  NormalizedMonthlyFinanceTrend,
  NormalizedProduct,
  NormalizedProductProfitability,
  NormalizedProductToPush,
  NormalizedPurchaseOrder,
  NormalizedPurchaseRecommendation,
  NormalizedSale,
  NormalizedStockForecast,
  NormalizedSupplier,
  PaginatedResult,
} from "@copilote/copilot-engine";
import { ProductResponseDto } from "../products/dto/product-response.dto";
import { ProductsService } from "../products/products.service";
import { PurchaseOrderResponseDto } from "../purchases/dto/purchase-order-response.dto";
import { PurchaseOrdersService } from "../purchases/purchase-orders.service";
import { SaleResponseDto } from "../sales/dto/sale-response.dto";
import { SalesService } from "../sales/sales.service";
import { StockService } from "../stock/stock.service";
import { SupplierResponseDto } from "../suppliers/dto/supplier-response.dto";
import { SuppliersService } from "../suppliers/suppliers.service";
import { FinanceService } from "../finance/finance.service";
import { ForecastService } from "../forecast/forecast.service";
import { FraudService } from "../fraud/fraud.service";
import { CommercialService } from "../commercial/commercial.service";
import { PurchasingService } from "../purchasing/purchasing.service";

const DEFAULT_RECENT_SALES_LIMIT = 20;
const MAX_RECENT_SALES_LIMIT = 50;

// Outils potentiellement volumineux (catalogue, fournisseurs, commandes...) :
// un audit de coûts a montré qu'ils renvoyaient jusque-là la totalité des
// données de l'organisation à chaque appel, sans limite — le coût d'une
// simple question évoluait alors proportionnellement à la taille du
// catalogue client. Même principe de bornage que get_recent_sales,
// généralisé à ces six outils, avec `totalCount` toujours exact pour ne pas
// dégrader les réponses de comptage.
const DEFAULT_PRODUCTS_LIMIT = 50;
const MAX_PRODUCTS_LIMIT = 200;
const DEFAULT_PENDING_PURCHASE_ORDERS_LIMIT = 30;
const MAX_PENDING_PURCHASE_ORDERS_LIMIT = 100;
const DEFAULT_SUPPLIERS_LIMIT = 50;
const MAX_SUPPLIERS_LIMIT = 200;
const DEFAULT_FORECAST_LIMIT = 50;
const MAX_FORECAST_LIMIT = 200;
const DEFAULT_PURCHASE_RECOMMENDATIONS_LIMIT = 50;
const MAX_PURCHASE_RECOMMENDATIONS_LIMIT = 200;

function paginate<T>(
  items: T[],
  limit: number | undefined,
  defaultLimit: number,
  maxLimit: number,
): PaginatedResult<T> {
  const boundedLimit = Math.min(Math.max(limit ?? defaultLimit, 1), maxLimit);
  return { totalCount: items.length, items: items.slice(0, boundedLimit) };
}

/**
 * Implémentation ERP du contrat `BusinessDataProvider` : adapte les
 * services NestJS existants (déjà filtrés par organisation) vers les
 * types normalisés attendus par le moteur IA. `tenantId` correspond ici à
 * `organizationId`, mais l'interface elle-même n'en dépend pas — un futur
 * `OdooDataProvider` implémenterait le même contrat sans ce mapping.
 */
@Injectable()
export class ErpDataProvider implements BusinessDataProvider {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockService: StockService,
    private readonly salesService: SalesService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly suppliersService: SuppliersService,
    private readonly financeService: FinanceService,
    private readonly forecastService: ForecastService,
    private readonly fraudService: FraudService,
    private readonly commercialService: CommercialService,
    private readonly purchasingService: PurchasingService,
  ) {}

  getFinanceSummary(
    tenantId: string,
    from?: string,
    to?: string,
  ): Promise<NormalizedFinanceSummary> {
    return this.financeService.getSummary(tenantId, from, to);
  }

  getProductsProfitability(
    tenantId: string,
    from?: string,
    to?: string,
  ): Promise<NormalizedProductProfitability[]> {
    return this.financeService.getProductsProfitability(tenantId, from, to);
  }

  async getStockAlerts(
    tenantId: string,
    limit?: number,
  ): Promise<PaginatedResult<NormalizedProduct>> {
    const products = await this.stockService.findAlerts(tenantId);
    const normalized = products.map((product) =>
      toNormalizedProduct(ProductResponseDto.fromEntity(product)),
    );
    return paginate(
      normalized,
      limit,
      DEFAULT_PRODUCTS_LIMIT,
      MAX_PRODUCTS_LIMIT,
    );
  }

  async getProducts(
    tenantId: string,
    limit?: number,
  ): Promise<PaginatedResult<NormalizedProduct>> {
    const products = await this.productsService.findAll(tenantId);
    const normalized = products.map((product) =>
      toNormalizedProduct(ProductResponseDto.fromEntity(product)),
    );
    return paginate(
      normalized,
      limit,
      DEFAULT_PRODUCTS_LIMIT,
      MAX_PRODUCTS_LIMIT,
    );
  }

  async getRecentSales(
    tenantId: string,
    limit?: number,
  ): Promise<NormalizedSale[]> {
    const boundedLimit = Math.min(
      Math.max(limit ?? DEFAULT_RECENT_SALES_LIMIT, 1),
      MAX_RECENT_SALES_LIMIT,
    );
    const sales = await this.salesService.findAll(tenantId);
    return sales
      .slice(0, boundedLimit)
      .map((sale) => toNormalizedSale(SaleResponseDto.fromEntity(sale)));
  }

  async getPendingPurchaseOrders(
    tenantId: string,
    limit?: number,
  ): Promise<PaginatedResult<NormalizedPurchaseOrder>> {
    const orders = await this.purchaseOrdersService.findAll(tenantId);
    const normalized = orders
      .filter((order) => order.status === PurchaseOrderStatus.PENDING)
      .map((order) =>
        toNormalizedPurchaseOrder(PurchaseOrderResponseDto.fromEntity(order)),
      );
    return paginate(
      normalized,
      limit,
      DEFAULT_PENDING_PURCHASE_ORDERS_LIMIT,
      MAX_PENDING_PURCHASE_ORDERS_LIMIT,
    );
  }

  async getSuppliers(
    tenantId: string,
    limit?: number,
  ): Promise<PaginatedResult<NormalizedSupplier>> {
    const suppliers = await this.suppliersService.findAll(tenantId);
    const normalized = suppliers.map((supplier) =>
      toNormalizedSupplier(SupplierResponseDto.fromEntity(supplier)),
    );
    return paginate(
      normalized,
      limit,
      DEFAULT_SUPPLIERS_LIMIT,
      MAX_SUPPLIERS_LIMIT,
    );
  }

  async getReplenishmentForecast(
    tenantId: string,
    limit?: number,
  ): Promise<PaginatedResult<NormalizedStockForecast>> {
    const forecast =
      await this.forecastService.getReplenishmentForecast(tenantId);
    return paginate(
      forecast,
      limit,
      DEFAULT_FORECAST_LIMIT,
      MAX_FORECAST_LIMIT,
    );
  }

  async getFraudAnomalies(tenantId: string): Promise<NormalizedFraudAnomaly[]> {
    const anomalies = await this.fraudService.getAnomalies(tenantId);
    // performedByUserId est un UUID brut qu'un modèle ne peut de toute façon
    // pas exploiter utilement dans une phrase (il ne peut pas le résoudre en
    // nom) — le retirer avant l'envoi à Anthropic est un gain net
    // (confidentialité + tokens) sans aucune perte de qualité de réponse.
    return anomalies.map((anomaly) => ({
      ...anomaly,
      performedByUserId: null,
    }));
  }

  getMonthlyFinanceTrend(
    tenantId: string,
    monthsBack?: number,
  ): Promise<NormalizedMonthlyFinanceTrend[]> {
    return this.financeService.getMonthlyTrend(tenantId, monthsBack);
  }

  getProductsToPush(tenantId: string): Promise<NormalizedProductToPush[]> {
    return this.commercialService.getProductsToPush(tenantId);
  }

  getCustomerInsights(
    tenantId: string,
    limit?: number,
  ): Promise<NormalizedCustomerInsight[]> {
    return this.commercialService.getCustomerInsights(tenantId, limit);
  }

  getCrossSellOpportunities(
    tenantId: string,
    limit?: number,
  ): Promise<NormalizedCrossSellPair[]> {
    return this.commercialService.getCrossSellOpportunities(tenantId, limit);
  }

  async getPurchaseRecommendations(
    tenantId: string,
    limit?: number,
  ): Promise<PaginatedResult<NormalizedPurchaseRecommendation>> {
    const recommendations =
      await this.purchasingService.getPurchaseRecommendations(tenantId);
    return paginate(
      recommendations,
      limit,
      DEFAULT_PURCHASE_RECOMMENDATIONS_LIMIT,
      MAX_PURCHASE_RECOMMENDATIONS_LIMIT,
    );
  }
}

function toNormalizedProduct(dto: ProductResponseDto): NormalizedProduct {
  return {
    id: dto.id,
    name: dto.name,
    sku: dto.sku,
    purchasePrice: dto.purchasePrice,
    salePrice: dto.salePrice,
    stockQuantity: dto.stockQuantity,
    minStock: dto.minStock,
    maxStock: dto.maxStock,
  };
}

function toNormalizedSale(dto: SaleResponseDto): NormalizedSale {
  return {
    id: dto.id,
    customerName: dto.customerName,
    paymentMethod: dto.paymentMethod,
    totalAmount: dto.totalAmount,
    items: dto.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    createdAt: dto.createdAt.toISOString(),
  };
}

function toNormalizedPurchaseOrder(
  dto: PurchaseOrderResponseDto,
): NormalizedPurchaseOrder {
  return {
    id: dto.id,
    supplierName: dto.supplierName,
    status: dto.status,
    totalAmount: dto.totalAmount,
    items: dto.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitCost: item.unitCost,
      lineTotal: item.lineTotal,
    })),
    createdAt: dto.createdAt.toISOString(),
  };
}

function toNormalizedSupplier(dto: SupplierResponseDto): NormalizedSupplier {
  return {
    id: dto.id,
    name: dto.name,
    contactName: dto.contactName,
    phone: dto.phone,
    email: dto.email,
  };
}
