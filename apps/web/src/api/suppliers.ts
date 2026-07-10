import type { SupplierDto } from '@copilote/shared';
import { apiClient } from '../lib/apiClient';

export interface CreateSupplierInput {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export const suppliersApi = {
  list: () => apiClient.get<SupplierDto[]>('/suppliers'),

  create: (input: CreateSupplierInput) => apiClient.post<SupplierDto>('/suppliers', input),

  update: (id: string, input: UpdateSupplierInput) =>
    apiClient.patch<SupplierDto>(`/suppliers/${id}`, input),
};
