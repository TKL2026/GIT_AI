import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

@Module({
  imports: [StockModule, SuppliersModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
})
export class PurchasesModule {}
