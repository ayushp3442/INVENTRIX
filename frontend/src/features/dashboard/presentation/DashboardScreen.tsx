'use client';
/** features/dashboard/presentation/DashboardScreen.tsx */
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { dashboardRepository } from '../data/dashboardRepository';
import { InventoryStats, CategoryBreakdown, InventoryTransaction } from '../domain/types';
import { AppShell } from '@/shared/layout/AppShell';
import { StatsCardSkeleton, TableRowSkeleton } from '@/shared/components/LoadingSkeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatCurrency, formatDateTime } from '@/core/utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Package, Layers, Truck, TrendingDown, XCircle, BarChart3,
  PieChart as PieIcon, History, RefreshCw, DollarSign,
} from 'lucide-react';
import { ROUTES } from '@/core/constants/routes';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const HEALTH_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

function TransactionBadge({ type }: { type: string }) {
  const map = {
    STOCK_IN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    STOCK_OUT: 'bg-rose-50 text-rose-700 border-rose-200',
    ADJUSTMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  } as Record<string, string>;
  const labels = { STOCK_IN: 'Stock In', STOCK_OUT: 'Stock Out', ADJUSTMENT: 'Adjustment' } as Record<string,string>;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${map[type] ?? ''}`}>
      {labels[type] ?? type}
    </span>
  );
}

export function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, t] = await Promise.all([
        dashboardRepository.getStats(),
        dashboardRepository.getCategoryBreakdown(),
        dashboardRepository.getRecentTransactions(),
      ]);
      setStats(s); setCategories(c); setTransactions(t);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const healthData = stats ? [
    { name: 'Healthy', value: stats.totalProducts - stats.lowStockProducts - stats.outOfStockProducts },
    { name: 'Low Stock', value: stats.lowStockProducts },
    { name: 'Out of Stock', value: stats.outOfStockProducts },
  ].filter((d) => d.value > 0) : [];

  const statCards = stats ? [
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Categories', value: stats.totalCategories, icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Suppliers', value: stats.totalSuppliers, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Valuation', value: formatCurrency(stats.totalInventoryValuation), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', isString: true },
    { label: 'Low Stock', value: stats.lowStockProducts, icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Out of Stock', value: stats.outOfStockProducts, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ] : [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Here is a real-time overview of your inventory
            </p>
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <StatsCardSkeleton key={i} />)
            : statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                      <div className={`p-1.5 rounded-lg ${card.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                      </div>
                    </div>
                    <p className={`text-xl font-extrabold ${card.color}`}>
                      {card.isString ? card.value : String(card.value)}
                    </p>
                  </div>
                );
              })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Stock by Category</h2>
            </div>
            <div className="h-56">
              {loading ? (
                <div className="h-full bg-slate-100 rounded-lg animate-pulse" />
              ) : categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="categoryName" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }} />
                    <Bar dataKey="totalStock" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Inventory Health</h2>
            </div>
            <div className="h-56">
              {loading ? (
                <div className="h-full bg-slate-100 rounded-lg animate-pulse" />
              ) : healthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={healthData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {healthData.map((_, i) => <Cell key={i} fill={HEALTH_COLORS[i % HEALTH_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">Recent Inventory Activity</h2>
            </div>
            <button
              onClick={() => router.push(ROUTES.LEDGER)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              View Full Ledger →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Date / Time</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-center">Qty Delta</th>
                  <th className="py-2.5 px-3 text-center">Stock Snapshot</th>
                  <th className="py-2.5 px-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                ) : transactions.length > 0 ? (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{formatDateTime(trx.transactionDate)}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {trx.productName ?? `Product #${trx.productId}`}
                        <span className="block text-[10px] text-slate-500 font-mono font-normal">SKU: {trx.productSku ?? 'N/A'}</span>
                      </td>
                      <td className="py-3 px-3"><TransactionBadge type={trx.transactionType} /></td>
                      <td className="py-3 px-3 font-mono font-bold text-center">
                        {trx.transactionType === 'STOCK_IN' && <span className="text-emerald-600">+{trx.quantity}</span>}
                        {trx.transactionType === 'STOCK_OUT' && <span className="text-rose-600">-{trx.quantity}</span>}
                        {trx.transactionType === 'ADJUSTMENT' && <span className="text-amber-600">{trx.newStock >= trx.previousStock ? '+' : '-'}{trx.quantity}</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-center text-slate-500">
                        {trx.previousStock} → <span className="text-slate-900 font-bold">{trx.newStock}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{trx.referenceNotes ?? '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6}><EmptyState title="No transactions yet" description="Stock operations will appear here" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
