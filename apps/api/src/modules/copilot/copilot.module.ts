import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { ProductsModule } from '../products/products.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { SalesModule } from '../sales/sales.module';
import { StockModule } from '../stock/stock.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';
import { ErpDataProvider } from './erp-data-provider';

@Module({
  imports: [ProductsModule, StockModule, SalesModule, PurchasesModule, SuppliersModule, FinanceModule],
  controllers: [CopilotController],
  providers: [ErpDataProvider, CopilotService],
})
export class CopilotModule {}
