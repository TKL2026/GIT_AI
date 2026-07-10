import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiBearerAuth()
@Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiCreatedResponse({ type: ExpenseResponseDto })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expensesService.create(
      currentUser.organizationId,
      currentUser.userId,
      dto,
    );
    return ExpenseResponseDto.fromEntity(expense);
  }

  @Get()
  @ApiOkResponse({ type: [ExpenseResponseDto] })
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: FinanceQueryDto,
  ): Promise<ExpenseResponseDto[]> {
    const expenses = await this.expensesService.findAll(
      currentUser.organizationId,
      query.from,
      query.to,
    );
    return expenses.map(ExpenseResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOkResponse({ type: ExpenseResponseDto })
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expensesService.findOne(currentUser.organizationId, id);
    return ExpenseResponseDto.fromEntity(expense);
  }
}
