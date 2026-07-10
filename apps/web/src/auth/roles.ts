import { Role, type UserDto } from '@copilote/shared';

export function hasRole(user: UserDto | null, allowedRoles: Role[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export const STOCK_MUTATION_ROLES = [Role.OWNER, Role.ADMIN, Role.DIRECTOR, Role.STOCK_MANAGER];
export const SALES_MUTATION_ROLES = [Role.OWNER, Role.ADMIN, Role.DIRECTOR, Role.CASHIER];
export const FINANCE_ROLES = [Role.OWNER, Role.ADMIN, Role.DIRECTOR];
export const SUPPLIER_MUTATION_ROLES = [Role.OWNER, Role.ADMIN, Role.DIRECTOR];
