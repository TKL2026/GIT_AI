import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { ListMovementsQueryDto } from './dto/list-movements-query.dto';
import { StockAdjustmentDto } from './dto/stock-adjustment.dto';
import { StockInDto } from './dto/stock-in.dto';
import { StockMovementResponseDto } from './dto/stock-movement-response.dto';
import { StockOutDto } from './dto/stock-out.dto';
import { StockService } from './stock.service';

const MUTATION_ROLES = [Role.OWNER, Role.ADMIN, Role.DIRECTOR, Role.STOCK_MANAGER] as const;

@ApiTags('stock')
@ApiBearerAuth()
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('movements/in')
  @Roles(...MUTATION_ROLES)
  @ApiCreatedResponse({ type: StockMovementResponseDto })
  async recordIn(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: StockInDto,
  ): Promise<StockMovementResponseDto> {
    const movement = await this.stockService.recordIn(
      currentUser.organizationId,
      currentUser.userId,
      dto,
    );
    return StockMovementResponseDto.fromEntity(movement);
  }

  @Post('movements/out')
  @Roles(...MUTATION_ROLES)
  @ApiCreatedResponse({ type: StockMovementResponseDto })
  async recordOut(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: StockOutDto,
  ): Promise<StockMovementResponseDto> {
    const movement = await this.stockService.recordOut(
      currentUser.organizationId,
      currentUser.userId,
      dto,
    );
    return StockMovementResponseDto.fromEntity(movement);
  }

  @Post('movements/adjustment')
  @Roles(...MUTATION_ROLES)
  @ApiCreatedResponse({ type: StockMovementResponseDto })
  async recordAdjustment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: StockAdjustmentDto,
  ): Promise<StockMovementResponseDto> {
    const movement = await this.stockService.recordAdjustment(
      currentUser.organizationId,
      currentUser.userId,
      dto,
    );
    return StockMovementResponseDto.fromEntity(movement);
  }

  @Get('movements')
  @ApiOkResponse({ type: [StockMovementResponseDto] })
  async findMovements(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListMovementsQueryDto,
  ): Promise<StockMovementResponseDto[]> {
    const movements = await this.stockService.findMovements(
      currentUser.organizationId,
      query.productId,
    );
    return movements.map(StockMovementResponseDto.fromEntity);
  }

  @Get('levels')
  @ApiOkResponse({ type: [ProductResponseDto] })
  async findLevels(@CurrentUser() currentUser: AuthenticatedUser): Promise<ProductResponseDto[]> {
    const products = await this.stockService.findLevels(currentUser.organizationId);
    return products.map(ProductResponseDto.fromEntity);
  }

  @Get('alerts')
  @ApiOkResponse({ type: [ProductResponseDto] })
  async findAlerts(@CurrentUser() currentUser: AuthenticatedUser): Promise<ProductResponseDto[]> {
    const products = await this.stockService.findAlerts(currentUser.organizationId);
    return products.map(ProductResponseDto.fromEntity);
  }
}
