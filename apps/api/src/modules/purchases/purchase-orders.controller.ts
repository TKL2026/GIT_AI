import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

const MUTATION_ROLES = [Role.OWNER, Role.ADMIN, Role.DIRECTOR, Role.STOCK_MANAGER] as const;

@ApiTags('purchases')
@ApiBearerAuth()
@Controller('purchases')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles(...MUTATION_ROLES)
  @ApiCreatedResponse({ type: PurchaseOrderResponseDto })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePurchaseOrderDto,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.purchaseOrdersService.create(
      currentUser.organizationId,
      currentUser.userId,
      dto,
    );
    return PurchaseOrderResponseDto.fromEntity(order);
  }

  @Get()
  @ApiOkResponse({ type: [PurchaseOrderResponseDto] })
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<PurchaseOrderResponseDto[]> {
    const orders = await this.purchaseOrdersService.findAll(currentUser.organizationId);
    return orders.map(PurchaseOrderResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.purchaseOrdersService.findOne(currentUser.organizationId, id);
    return PurchaseOrderResponseDto.fromEntity(order);
  }

  @Post(':id/receive')
  @Roles(...MUTATION_ROLES)
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  async receive(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.purchaseOrdersService.receive(
      currentUser.organizationId,
      currentUser.userId,
      id,
    );
    return PurchaseOrderResponseDto.fromEntity(order);
  }

  @Post(':id/cancel')
  @Roles(...MUTATION_ROLES)
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  async cancel(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.purchaseOrdersService.cancel(currentUser.organizationId, id);
    return PurchaseOrderResponseDto.fromEntity(order);
  }
}
