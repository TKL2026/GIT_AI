import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOkResponse({ type: [ProductResponseDto] })
  async findAll(@CurrentUser() currentUser: AuthenticatedUser): Promise<ProductResponseDto[]> {
    const products = await this.productsService.findAll(currentUser.organizationId);
    return products.map(ProductResponseDto.fromEntity);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProductResponseDto })
  async findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.findOne(currentUser.organizationId, id);
    return ProductResponseDto.fromEntity(product);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN, Role.DIRECTOR, Role.STOCK_MANAGER)
  @ApiCreatedResponse({ type: ProductResponseDto })
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productsService.create(currentUser.organizationId, dto);
    return ProductResponseDto.fromEntity(product);
  }
}
