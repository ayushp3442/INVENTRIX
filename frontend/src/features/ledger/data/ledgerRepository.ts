/** features/ledger/data/ledgerRepository.ts */
import { httpClient } from '@/core/api/httpClient';
import { InventoryTransaction } from '../domain/types';

export const ledgerRepository = {
  getTransactions: (params?: { productId?: number; type?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.productId) q.set('productId', params.productId.toString());
    if (params?.type) q.set('type', params.type);
    q.set('limit', (params?.limit ?? 50).toString());
    return httpClient.get<InventoryTransaction[]>(`/inventory/transactions?${q.toString()}`);
  },
};
