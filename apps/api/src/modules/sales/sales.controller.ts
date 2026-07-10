import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR, Role.CASHIER)
  @ApiCreatedResponse({ type: SaleResponseDto })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    const sale = await this.salesService.create(currentUser.organizationId, currentUser.userId, dto);
    return SaleResponseDto.fromEntity(sale);
  }

  @Get()
  @ApiOkResponse({ type: [SaleResponseDto] })
  async findAll(@CurrentUser() currentUser: AuthenticatedUser): Promise<SaleResponseDto[]> {
    const sales = await this.salesService.findAll(currentUser.organizationId);
    return sales.map(SaleResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOkResponse({ type: SaleResponseDto })
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SaleResponseDto> {
    const sale = await this.salesService.findOne(currentUser.organizationId, id);
    return SaleResponseDto.fromEntity(sale);
  }
}
