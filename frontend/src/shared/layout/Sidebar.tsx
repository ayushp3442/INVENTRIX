'use client';
/** shared/layout/Sidebar.tsx */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useAuth } from '@/core/auth/AuthContext';
import { ROUTES } from '@/core/constants/routes';
import {
  LayoutDashboard,
  Package,
  ArrowUpDown,
  History,
  Layers,
  Truck,
  Send,
  Activity,
  ShoppingCart,
} from 'lucide-react';

const adminLinks = [
  { label: 'Overview', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'New Sale / Billing', href: ROUTES.SALES, icon: ShoppingCart },
  { label: 'Products', href: ROUTES.PRODUCTS, icon: Package },
  { label: 'Stock Operations', href: ROUTES.STOCK_OPERATIONS, icon: ArrowUpDown },
  { label: 'Audit Ledger', href: ROUTES.LEDGER, icon: History },
  { label: 'Categories', href: ROUTES.CATEGORIES, icon: Layers },
  { label: 'Suppliers', href: ROUTES.SUPPLIERS, icon: Truck },
];

const staffLinks = [
  { label: 'Overview', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'New Sale / Billing', href: ROUTES.SALES, icon: ShoppingCart },
  { label: 'Product Catalog', href: ROUTES.PRODUCTS, icon: Package },
  { label: 'Dispatch (Stock Out)', href: ROUTES.STOCK_OPERATIONS, icon: Send },
  { label: 'Audit Ledger', href: ROUTES.LEDGER, icon: History },
];

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  const links = user.role === 'ADMIN' ? adminLinks : staffLinks;

  return (
    <aside className="w-60 shrink-0 bg-white min-h-[calc(100vh-57px)] border-r border-slate-200 p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              const isSale = link.href === ROUTES.SALES;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : isSale
                      ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 bg-indigo-50/50'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className={clsx('w-4 h-4', isActive ? 'text-white' : isSale ? 'text-indigo-600' : 'text-slate-500')} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-emerald-600" />
          <p className="font-semibold text-slate-700 text-[11px]">System Active</p>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          ACID transactional ledger - PostgreSQL
        </p>
      </div>
    </aside>
  );
}