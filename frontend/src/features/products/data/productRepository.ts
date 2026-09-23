/** features/products/data/productRepository.ts */
import { httpClient } from '@/core/api/httpClient';
import { Product, ProductRequest } from '../domain/types';

export const productRepository = {
  getAll: (params?: { search?: string; categoryId?: number; supplierId?: number; lowStock?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.categoryId) q.set('categoryId', params.categoryId.toString());
    if (params?.supplierId) q.set('supplierId', params.supplierId.toString());
    if (params?.lowStock) q.set('lowStock', 'true');
    const qs = q.toString();
    return httpClient.get<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  },

  getById: (id: number) =>
    httpClient.get<Product>(`/products/${id}`),

  create: (data: ProductRequest) =>
    httpClient.post<Product>('/products', data),

  update: (id: number, data: ProductRequest) =>
    httpClient.put<Product>(`/products/${id}`, data),

  delete: (id: number) =>
    httpClient.delete(`/products/${id}`),
};
