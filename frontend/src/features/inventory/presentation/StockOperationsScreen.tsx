'use client';
/** features/inventory/presentation/StockOperationsScreen.tsx */
import React, { useEffect, useState, useCallback } from 'react';
import { inventoryRepository } from '../data/inventoryRepository';
import { productRepository } from '@/features/products/data/productRepository';
import { Product } from '../domain/types';
import { AppShell } from '@/shared/layout/AppShell';
import { formatCurrency } from '@/core/utils/formatters';
import { ArrowUpDown, PackagePlus, PackageMinus, ClipboardCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'IN' | 'OUT' | 'ADJUST';

export function StockOperationsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [physicalCount, setPhysicalCount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('IN');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const load = useCallback(async () => {
    try { setProducts(await productRepository.getAll()); }
    catch (err: unknown) { toast.error((err as Error).message ?? 'Failed to load products'); }
    finally { setLoadingProducts(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const numQty = Number(quantity);
  const numPhys = Number(physicalCount);
  const adjustDiff = selectedProduct ? numPhys - selectedProduct.currentStock : 0;

  const resetForm = () => { setQuantity(''); setUnitPrice(''); setNotes(''); setPhysicalCount(''); setAdjustReason(''); };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setLoading(true);
    try {
      await inventoryRepository.stockIn({ productId: Number(selectedProductId), quantity: numQty, unitPrice: unitPrice ? Number(unitPrice) : undefined, notes });
      toast.success(`Stock In recorded: +${numQty} units`);
      resetForm(); await load();
    } catch (err: unknown) { toast.error((err as Error).message ?? 'Stock In failed'); }
    finally { setLoading(false); }
  };

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setLoading(true);
    try {
      await inventoryRepository.stockOut({ productId: Number(selectedProductId), quantity: numQty, unitPrice: unitPrice ? Number(unitPrice) : undefined, notes });
      toast.success(`Stock Out recorded: -${numQty} units`);
      resetForm(); await load();
    } catch (err: unknown) { toast.error((err as Error).message ?? 'Stock Out failed'); }
    finally { setLoading(false); }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || adjustDiff === 0) return;
    setLoading(true);
    try {
      await inventoryRepository.adjustment({ productId: Number(selectedProductId), newPhysicalCount: numPhys, reason: adjustReason });
      toast.success(`Adjustment recorded: new count = ${numPhys}`);
      resetForm(); await load();
    } catch (err: unknown) { toast.error((err as Error).message ?? 'Adjustment failed'); }
    finally { setLoading(false); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'IN', label: 'Stock In', icon: <PackagePlus className="w-4 h-4" />, color: 'emerald' },
    { key: 'OUT', label: 'Stock Out', icon: <PackageMinus className="w-4 h-4" />, color: 'rose' },
    { key: 'ADJUST', label: 'Adjustment', icon: <ClipboardCheck className="w-4 h-4" />, color: 'amber' },
  ];

  const tabColorMap: Record<Tab, { active: string; btn: string }> = {
    IN: { active: 'bg-emerald-600 text-white', btn: 'w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer' },
    OUT: { active: 'bg-rose-600 text-white', btn: 'w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer' },
    ADJUST: { active: 'bg-amber-600 text-white', btn: 'w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors cursor-pointer' },
  };

  const fieldCls = "w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white";

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-slate-700" /> Stock Operations
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Record inflows, outflows, and physical audit adjustments</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setActiveTab(t.key); resetForm(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === t.key ? tabColorMap[t.key].active : 'text-slate-600 hover:text-slate-900'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Product Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Select Product *</label>
            <select value={selectedProductId} onChange={(e) => { setSelectedProductId(e.target.value); resetForm(); }} className={fieldCls} disabled={loadingProducts}>
              <option value="">{loadingProducts ? 'Loading products...' : '-- Select a product --'}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) · Available: {p.currentStock} {p.unit}</option>)}
            </select>
          </div>

          {selectedProduct && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div><span className="text-slate-500 block">Current Stock</span><span className="font-extrabold text-slate-900 text-sm">{selectedProduct.currentStock} {selectedProduct.unit}</span></div>
              <div><span className="text-slate-500 block">Purchase Cost</span><span className="font-bold text-slate-700">{formatCurrency(selectedProduct.purchasePrice)}</span></div>
              <div><span className="text-slate-500 block">Selling Price</span><span className="font-bold text-emerald-700">{formatCurrency(selectedProduct.sellingPrice)}</span></div>
            </div>
          )}

          {/* STOCK IN */}
          {activeTab === 'IN' && (
            <form onSubmit={handleStockIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity *</label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className={fieldCls} placeholder="e.g. 50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Cost (₹)</label>
                  <input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={fieldCls} placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">PO / Reference Notes</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldCls} placeholder="e.g. PO-88492 from supplier" />
              </div>
              {selectedProduct && numQty > 0 && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                  <span>Projected Stock:</span>
                  <span className="font-extrabold font-mono">{selectedProduct.currentStock} + {numQty} = {selectedProduct.currentStock + numQty} {selectedProduct.unit}</span>
                </div>
              )}
              <button type="submit" disabled={loading || !selectedProductId} className={tabColorMap.IN.btn}>
                {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Confirm Receiving & Record Inflow'}
              </button>
            </form>
          )}

          {/* STOCK OUT */}
          {activeTab === 'OUT' && (
            <form onSubmit={handleStockOut} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity *</label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className={fieldCls} placeholder="e.g. 10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit Sell Price (₹)</label>
                  <input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={fieldCls} placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Sales Order / Reference</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldCls} placeholder="e.g. Invoice #48201" />
              </div>
              {selectedProduct && numQty > 0 && (
                numQty > selectedProduct.currentStock ? (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Insufficient stock! Requested {numQty} &gt; available {selectedProduct.currentStock}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                    <span>Projected Stock:</span>
                    <span className="font-extrabold font-mono">{selectedProduct.currentStock} - {numQty} = {selectedProduct.currentStock - numQty} {selectedProduct.unit}</span>
                  </div>
                )
              )}
              <button type="submit" disabled={loading || !selectedProductId || numQty > (selectedProduct?.currentStock ?? 0)} className={tabColorMap.OUT.btn}>
                {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Confirm Dispatch & Record Outflow'}
              </button>
            </form>
          )}

          {/* ADJUSTMENT */}
          {activeTab === 'ADJUST' && (
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Physical Stock Count *</label>
                <input type="number" min="0" value={physicalCount} onChange={(e) => setPhysicalCount(e.target.value)} required className={fieldCls} placeholder="Actual count from physical audit" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reason *</label>
                <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} required className={fieldCls} placeholder="e.g. Physical count discrepancy / Damaged goods" />
              </div>
              {selectedProduct && physicalCount !== '' && (
                <div className={`p-3 rounded-lg border text-xs flex items-center justify-between font-mono ${adjustDiff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : adjustDiff < 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <span>Adjustment Variance:</span>
                  <span className="font-extrabold">{adjustDiff > 0 ? `+${adjustDiff}` : adjustDiff} {selectedProduct.unit}</span>
                </div>
              )}
              <button type="submit" disabled={loading || !selectedProductId || adjustDiff === 0} className={tabColorMap.ADJUST.btn}>
                {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Reconcile & Record Audit Adjustment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
