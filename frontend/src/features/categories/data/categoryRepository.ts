/** features/categories/data/categoryRepository.ts */
import { httpClient } from '@/core/api/httpClient';
import { Category } from '../domain/types';

export const categoryRepository = {
  getAll: () => httpClient.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => httpClient.post<Category>('/categories', data),
  update: (id: number, data: Partial<Category>) => httpClient.put<Category>(`/categories/${id}`, data),
  delete: (id: number) => httpClient.delete(`/categories/${id}`),
};
