/** features/sales/data/salesRepository.ts */
import { httpClient } from '@/core/api/httpClient';
import { Product } from '@/features/products/domain/types';
import { SaleBillRequestDto } from '../domain/types';

export const salesRepository = {
  getProducts: async (): Promise<Product[]> => {
    return httpClient.get<Product[]>('/products');
  },

  completeSale: async (request: SaleBillRequestDto) => {
    return httpClient.post('/inventory/sale', request);
  },
};