'use client';
/** shared/layout/Navbar.tsx */
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/core/auth/AuthContext';
import { ROUTES } from '@/core/constants/routes';
import { LogOut, Shield, User, Package, ShoppingCart } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Package className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-slate-900">INVENTRIX</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              Enterprise
            </span>
          </div>
        </div>

        {/* User Actions */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Quick POS Sale Button */}
            <Link
              href={ROUTES.SALES}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>New Transaction</span>
            </Link>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                {user.role === 'ADMIN' ? (
                  <Shield className="w-3.5 h-3.5 text-slate-900" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-700" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                  {user.role === 'ADMIN' ? 'System Administrator' : 'Warehouse Operator'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}