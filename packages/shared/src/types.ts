import { Role } from './role.enum';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  createdAt: string;
}

export interface OrganizationDto {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductDto {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  purchasePrice: number;
  salePrice: number;
  createdAt: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: UserDto;
}
