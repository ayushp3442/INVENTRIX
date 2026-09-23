/** features/inventory/data/inventoryRepository.ts */
import { httpClient } from '@/core/api/httpClient';
import { InventoryTransaction, InventoryStats, CategoryBreakdown, StockInRequest, StockOutRequest, StockAdjustmentRequest } from '../domain/types';

export const inventoryRepository = {
  stockIn: (data: StockInRequest) =>
    httpClient.post<InventoryTransaction>('/inventory/stock-in', data),

  stockOut: (data: StockOutRequest) =>
    httpClient.post<InventoryTransaction>('/inventory/stock-out', data),

  adjustment: (data: StockAdjustmentRequest) =>
    httpClient.post<InventoryTransaction>('/inventory/adjustment', data),

  getStatistics: () =>
    httpClient.get<InventoryStats>('/inventory/statistics'),

  getCategoryBreakdown: () =>
    httpClient.get<CategoryBreakdown[]>('/inventory/category-breakdown'),
};
