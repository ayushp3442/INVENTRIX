'use client';
/** features/ledger/presentation/LedgerScreen.tsx */
import React, { useEffect, useState, useCallback } from 'react';
import { ledgerRepository } from '../data/ledgerRepository';
import { productRepository } from '@/features/products/data/productRepository';
import { InventoryTransaction, Product } from '../domain/types';
import { AppShell } from '@/shared/layout/AppShell';
import { EmptyState } from '@/shared/components/EmptyState';
import { TableRowSkeleton } from '@/shared/components/LoadingSkeleton';
import { formatCurrency, formatDateTime } from '@/core/utils/formatters';
import { History, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

function TxBadge({ type }: { type: string }) {
  const map = { STOCK_IN: 'bg-emerald-50 text-emerald-700 border-emerald-200', STOCK_OUT: 'bg-rose-50 text-rose-700 border-rose-200', ADJUSTMENT: 'bg-amber-50 text-amber-700 border-amber-200' } as Record<string,string>;
  const labels = { STOCK_IN: 'Stock In', STOCK_OUT: 'Stock Out', ADJUSTMENT: 'Adjustment' } as Record<string,string>;
  return <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${map[type] ?? ''}`}>{labels[type] ?? type}</span>;
}

export function LedgerScreen() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [limit, setLimit] = useState('50');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        ledgerRepository.getTransactions({ productId: productFilter ? Number(productFilter) : undefined, type: typeFilter || undefined, limit: Number(limit) }),
        productRepository.getAll(),
      ]);
      setTransactions(t); setProducts(p);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [productFilter, typeFilter, limit]);

  useEffect(() => { load(); }, [load]);

  const selectCls = "px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-700";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-700" /> Audit Transaction Ledger
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Immutable chronological record of all stock movements</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm cursor-pointer transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={selectCls}>
              <option value="">All Products</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectCls}>
              <option value="">All Types</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
            <select value={limit} onChange={(e) => setLimit(e.target.value)} className={selectCls}>
              <option value="25">Last 25</option>
              <option value="50">Last 50</option>
              <option value="100">Last 100</option>
              <option value="250">Last 250</option>
            </select>
            <div className="flex items-center justify-end text-xs text-slate-500 font-mono font-medium">
              {transactions.length} records
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">TRX #</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Delta</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Snapshot</th>
                  <th className="py-3 px-4">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-mono">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={8} />)
                ) : transactions.length > 0 ? (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-bold">#{trx.id}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{formatDateTime(trx.transactionDate)}</td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">
                        {trx.productName ?? `Product #${trx.productId}`}
                        <span className="block text-[10px] text-slate-500 font-mono font-normal">SKU: {trx.productSku ?? 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4 font-sans"><TxBadge type={trx.transactionType} /></td>
                      <td className="py-3 px-4 text-center font-bold">
                        {trx.transactionType === 'STOCK_IN' && <span className="text-emerald-700">+{trx.quantity}</span>}
                        {trx.transactionType === 'STOCK_OUT' && <span className="text-rose-700">-{trx.quantity}</span>}
                        {trx.transactionType === 'ADJUSTMENT' && <span className="text-amber-700">{trx.newStock >= trx.previousStock ? '+' : '-'}{trx.quantity}</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 font-semibold">{formatCurrency(trx.unitPrice)}</td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {trx.previousStock} → <span className="text-slate-900 font-bold">{trx.newStock}</span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">{trx.referenceNotes ?? '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8}><EmptyState title="No transactions found" description="Try changing filters or record some stock operations" icon={<History className="w-7 h-7" />} /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
