import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOkResponse({ type: [SupplierResponseDto] })
  async findAll(@CurrentUser() currentUser: AuthenticatedUser): Promise<SupplierResponseDto[]> {
    const suppliers = await this.suppliersService.findAll(currentUser.organizationId);
    return suppliers.map(SupplierResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOkResponse({ type: SupplierResponseDto })
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.findOne(currentUser.organizationId, id);
    return SupplierResponseDto.fromEntity(supplier);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
  @ApiCreatedResponse({ type: SupplierResponseDto })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateSupplierDto,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.create(currentUser.organizationId, dto);
    return SupplierResponseDto.fromEntity(supplier);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR)
  @ApiOkResponse({ type: SupplierResponseDto })
  async update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.suppliersService.update(currentUser.organizationId, id, dto);
    return SupplierResponseDto.fromEntity(supplier);
  }
}
