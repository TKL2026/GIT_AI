import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  controllers: [ExpensesController, FinanceController],
  providers: [ExpensesService, FinanceService],
})
export class FinanceModule {}
