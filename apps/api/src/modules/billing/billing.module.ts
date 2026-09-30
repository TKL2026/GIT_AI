import { Module } from '@nestjs/common';
import { CamPayModule } from '../campay/campay.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CamPayWebhookController } from './campay-webhook.controller';

@Module({
  imports: [CamPayModule],
  controllers: [BillingController, CamPayWebhookController],
  providers: [BillingService],
})
export class BillingModule {}
