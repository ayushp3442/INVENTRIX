/** features/suppliers/data/supplierRepository.ts */
import { httpClient } from '@/core/api/httpClient';
import { Supplier } from '../domain/types';

export const supplierRepository = {
  getAll: () => httpClient.get<Supplier[]>('/suppliers'),
  create: (data: Partial<Supplier>) => httpClient.post<Supplier>('/suppliers', data),
  update: (id: number, data: Partial<Supplier>) => httpClient.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: number) => httpClient.delete(`/suppliers/${id}`),
};
