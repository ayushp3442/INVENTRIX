/** features/dashboard/data/dashboardRepository.ts */
import { httpClient } from '@/core/api/httpClient';
import { InventoryStats, CategoryBreakdown, InventoryTransaction } from '../domain/types';

export const dashboardRepository = {
  getStats: () => httpClient.get<InventoryStats>('/inventory/statistics'),
  getCategoryBreakdown: () => httpClient.get<CategoryBreakdown[]>('/inventory/category-breakdown'),
  getRecentTransactions: () => {
    const q = new URLSearchParams({ limit: '8' });
    return httpClient.get<InventoryTransaction[]>(`/inventory/transactions?${q.toString()}`);
  },
};
