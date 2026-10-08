import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsImportService } from './products-import.service';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsImportService],
  exports: [ProductsService],
})
export class ProductsModule {}
