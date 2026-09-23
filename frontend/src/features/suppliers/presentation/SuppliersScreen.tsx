'use client';
/** features/suppliers/presentation/SuppliersScreen.tsx */
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { supplierRepository } from '../data/supplierRepository';
import { Supplier } from '../domain/types';
import { AppShell } from '@/shared/layout/AppShell';
import { EmptyState } from '@/shared/components/EmptyState';
import { TableRowSkeleton } from '@/shared/components/LoadingSkeleton';
import { Truck, Plus, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY: Partial<Supplier> = { name: '', contactPerson: '', phone: '', email: '', address: '' };

export function SuppliersScreen() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSuppliers(await supplierRepository.getAll()); }
    catch (err: unknown) { toast.error((err as Error).message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setIsModalOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, contactPerson: s.contactPerson, phone: s.phone, email: s.email, address: s.address }); setIsModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) { await supplierRepository.update(editing.id, form); toast.success('Supplier updated'); }
      else { await supplierRepository.create(form); toast.success('Supplier registered'); }
      setIsModalOpen(false); await load();
    } catch (err: unknown) { toast.error((err as Error).message ?? 'Operation failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    try { await supplierRepository.delete(s.id); toast.success('Supplier deleted'); await load(); }
    catch (err: unknown) { toast.error((err as Error).message ?? 'Delete failed'); }
  };

  const sf = (k: keyof Supplier, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-700" /> Suppliers
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{suppliers.length} registered vendors</p>
          </div>
          {user?.role === 'ADMIN' && (
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Supplier
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Representative</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Location</th>
                {user?.role === 'ADMIN' && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={user?.role === 'ADMIN' ? 5 : 4} />)
              ) : suppliers.length > 0 ? (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {s.contactPerson ? <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" />{s.contactPerson}</div> : <span className="italic text-slate-400">N/A</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 space-y-0.5">
                      {s.phone && <div className="flex items-center gap-1.5 font-mono text-[11px]"><Phone className="w-3 h-3 text-slate-400" />{s.phone}</div>}
                      {s.email && <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-600"><Mail className="w-3 h-3 text-slate-400" />{s.email}</div>}
                      {!s.phone && !s.email && <span className="italic text-slate-400">No contact</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {s.address ? <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400 shrink-0" />{s.address}</div> : <span className="italic text-slate-400">N/A</span>}
                    </td>
                    {user?.role === 'ADMIN' && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={user?.role === 'ADMIN' ? 5 : 4}><EmptyState title="No suppliers registered" description="Add your vendor contacts here" icon={<Truck className="w-7 h-7" />} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">{editing ? 'Edit Supplier' : 'Register Supplier'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name *</label>
                <input value={form.name} onChange={(e) => sf('name', e.target.value)} required placeholder="e.g. Acme Tech" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Person</label>
                  <input value={form.contactPerson} onChange={(e) => sf('contactPerson', e.target.value)} placeholder="John Doe" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => sf('phone', e.target.value)} placeholder="+91 98765 43210" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => sf('email', e.target.value)} placeholder="contact@vendor.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => sf('address', e.target.value)} rows={2} placeholder="Street, City..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-60 cursor-pointer">
                  {editing ? 'Save Changes' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
