'use client';
/** features/products/presentation/ProductsScreen.tsx */
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { productRepository } from '../data/productRepository';
import { categoryRepository } from '@/features/categories/data/categoryRepository';
import { supplierRepository } from '@/features/suppliers/data/supplierRepository';
import { Product, ProductRequest, Category, Supplier } from '../domain/types';
import { AppShell } from '@/shared/layout/AppShell';
import { EmptyState } from '@/shared/components/EmptyState';
import { TableRowSkeleton } from '@/shared/components/LoadingSkeleton';
import { formatCurrency } from '@/core/utils/formatters';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

function StockBadge({ stock, min }: { stock: number; min: number }) {
  if (stock === 0) return <span className="inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200">Out of Stock</span>;
  if (stock <= min) return <span className="inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200">Low Stock</span>;
  return <span className="inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200">In Stock</span>;
}

const EMPTY_FORM: ProductRequest = {
  sku: '', name: '', description: '', purchasePrice: 0, sellingPrice: 0,
  minimumStockLevel: 5, unit: 'pcs', initialStock: 0,
};

export function ProductsScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([
        productRepository.getAll(),
        categoryRepository.getAll(),
        supplierRepository.getAll(),
      ]);
      setProducts(p); setCategories(c); setSuppliers(s);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = products.filter((p) =>
    search === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ sku: p.sku, name: p.name, description: p.description ?? '', categoryId: p.categoryId, supplierId: p.supplierId, purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, minimumStockLevel: p.minimumStockLevel, unit: p.unit });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await productRepository.update(editing.id, form);
        toast.success(`"${form.name}" updated successfully`);
      } else {
        await productRepository.create(form);
        toast.success(`"${form.name}" registered successfully`);
      }
      setIsModalOpen(false);
      await loadAll();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await productRepository.delete(p.id);
      toast.success(`"${p.name}" deleted`);
      await loadAll();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Delete failed');
    }
  };

  const setField = (key: keyof ProductRequest, val: string | number | undefined) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-700" /> Product Catalog
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {products.length} products · Manage your inventory items
            </p>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Register Product
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Sell</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {user?.role === 'ADMIN' && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={user?.role === 'ADMIN' ? 8 : 7} />)
                ) : filtered.length > 0 ? (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{p.categoryName ?? <span className="text-slate-400 italic">—</span>}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{p.supplierName ?? <span className="text-slate-400 italic">—</span>}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(p.purchasePrice)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(p.sellingPrice)}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {p.currentStock} <span className="text-[10px] font-normal text-slate-500">{p.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StockBadge stock={p.currentStock} min={p.minimumStockLevel} />
                      </td>
                      {user?.role === 'ADMIN' && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={user?.role === 'ADMIN' ? 8 : 7}>
                    <EmptyState title={search ? 'No products match your search' : 'No products registered'} description={search ? 'Try a different search term' : 'Click Register Product to add your first item'} icon={<Package className="w-7 h-7" />} />
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">{editing ? `Edit: ${editing.sku}` : 'Register New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl leading-none cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">SKU Code *</label>
                  <input value={form.sku} onChange={(e) => setField('sku', e.target.value)} required placeholder="e.g. ELC-KB-101" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Product Name *</label>
                  <input value={form.name} onChange={(e) => setField('name', e.target.value)} required placeholder="e.g. Wireless Mouse" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={2} placeholder="Product specifications..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select value={form.categoryId ?? ''} onChange={(e) => setField('categoryId', e.target.value ? Number(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white">
                    <option value="">Select Category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Supplier</label>
                  <select value={form.supplierId ?? ''} onChange={(e) => setField('supplierId', e.target.value ? Number(e.target.value) : undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white">
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Purchase Price *</label>
                  <input type="number" step="0.01" min="0" value={form.purchasePrice} onChange={(e) => setField('purchasePrice', Number(e.target.value))} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Selling Price *</label>
                  <input type="number" step="0.01" min="0" value={form.sellingPrice} onChange={(e) => setField('sellingPrice', Number(e.target.value))} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Min Stock Alert *</label>
                  <input type="number" min="0" value={form.minimumStockLevel} onChange={(e) => setField('minimumStockLevel', Number(e.target.value))} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Unit *</label>
                  <input value={form.unit} onChange={(e) => setField('unit', e.target.value)} required placeholder="pcs, box..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                {!editing && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Opening Stock</label>
                    <input type="number" min="0" value={form.initialStock} onChange={(e) => setField('initialStock', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-60 cursor-pointer flex items-center gap-2">
                  {submitting && <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editing ? 'Save Changes' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
