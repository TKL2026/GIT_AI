import { Injectable } from '@nestjs/common';
import { PurchaseOrderStatus } from '@prisma/client';
import {
  BusinessDataProvider,
  NormalizedFinanceSummary,
  NormalizedProduct,
  NormalizedProductProfitability,
  NormalizedPurchaseOrder,
  NormalizedSale,
  NormalizedStockForecast,
  NormalizedSupplier,
} from '@copilote/copilot-engine';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { ProductsService } from '../products/products.service';
import { PurchaseOrderResponseDto } from '../purchases/dto/purchase-order-response.dto';
import { PurchaseOrdersService } from '../purchases/purchase-orders.service';
import { SaleResponseDto } from '../sales/dto/sale-response.dto';
import { SalesService } from '../sales/sales.service';
import { StockService } from '../stock/stock.service';
import { SupplierResponseDto } from '../suppliers/dto/supplier-response.dto';
import { SuppliersService } from '../suppliers/suppliers.service';
import { FinanceService } from '../finance/finance.service';
import { ForecastService } from '../forecast/forecast.service';

const DEFAULT_RECENT_SALES_LIMIT = 20;
const MAX_RECENT_SALES_LIMIT = 50;

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
  ) {}

  getFinanceSummary(tenantId: string, from?: string, to?: string): Promise<NormalizedFinanceSummary> {
    return this.financeService.getSummary(tenantId, from, to);
  }

  getProductsProfitability(
    tenantId: string,
    from?: string,
    to?: string,
  ): Promise<NormalizedProductProfitability[]> {
    return this.financeService.getProductsProfitability(tenantId, from, to);
  }

  async getStockAlerts(tenantId: string): Promise<NormalizedProduct[]> {
    const products = await this.stockService.findAlerts(tenantId);
    return products.map((product) => toNormalizedProduct(ProductResponseDto.fromEntity(product)));
  }

  async getProducts(tenantId: string): Promise<NormalizedProduct[]> {
    const products = await this.productsService.findAll(tenantId);
    return products.map((product) => toNormalizedProduct(ProductResponseDto.fromEntity(product)));
  }

  async getRecentSales(tenantId: string, limit?: number): Promise<NormalizedSale[]> {
    const boundedLimit = Math.min(Math.max(limit ?? DEFAULT_RECENT_SALES_LIMIT, 1), MAX_RECENT_SALES_LIMIT);
    const sales = await this.salesService.findAll(tenantId);
    return sales.slice(0, boundedLimit).map((sale) => toNormalizedSale(SaleResponseDto.fromEntity(sale)));
  }

  async getPendingPurchaseOrders(tenantId: string): Promise<NormalizedPurchaseOrder[]> {
    const orders = await this.purchaseOrdersService.findAll(tenantId);
    return orders
      .filter((order) => order.status === PurchaseOrderStatus.PENDING)
      .map((order) => toNormalizedPurchaseOrder(PurchaseOrderResponseDto.fromEntity(order)));
  }

  async getSuppliers(tenantId: string): Promise<NormalizedSupplier[]> {
    const suppliers = await this.suppliersService.findAll(tenantId);
    return suppliers.map((supplier) => toNormalizedSupplier(SupplierResponseDto.fromEntity(supplier)));
  }

  getReplenishmentForecast(tenantId: string): Promise<NormalizedStockForecast[]> {
    return this.forecastService.getReplenishmentForecast(tenantId);
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

function toNormalizedPurchaseOrder(dto: PurchaseOrderResponseDto): NormalizedPurchaseOrder {
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
