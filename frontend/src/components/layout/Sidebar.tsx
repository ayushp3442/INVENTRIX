'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  Package,
  ArrowUpDown,
  History,
  Layers,
  Truck,
  Send,
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const pathname = usePathname();

  const adminLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/products', icon: Package },
    { label: 'Stock Operations', href: '/stock-operations', icon: ArrowUpDown },
    { label: 'Audit Ledger', href: '/ledger', icon: History },
    { label: 'Categories', href: '/categories', icon: Layers },
    { label: 'Suppliers', href: '/suppliers', icon: Truck },
  ];

  const staffLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Product Catalog', href: '/products', icon: Package },
    { label: 'Dispatch (Stock Out)', href: '/stock-operations', icon: Send },
    { label: 'Audit Ledger', href: '/ledger', icon: History },
  ];

  const links = role === 'ADMIN' ? adminLinks : staffLinks;

  return (
    <aside className="w-60 shrink-0 bg-white min-h-[calc(100vh-57px)] border-r border-slate-200 p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className={clsx('w-4 h-4', isActive ? 'text-white' : 'text-slate-500')} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">Inventory Status</p>
        <p className="text-[10px] text-slate-500 leading-tight">
          Real-time ACID transactional ledger active
        </p>
      </div>
    </aside>
  );
};
