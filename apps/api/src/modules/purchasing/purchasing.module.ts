import { Module } from '@nestjs/common';
import { ForecastModule } from '../forecast/forecast.module';
import { PurchasingController } from './purchasing.controller';
import { PurchasingService } from './purchasing.service';

@Module({
  imports: [ForecastModule],
  controllers: [PurchasingController],
  providers: [PurchasingService],
  exports: [PurchasingService],
})
export class PurchasingModule {}
