import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border transition-colors',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export function getStockBadge(currentStock: number, minStockLevel: number) {
  if (currentStock === 0) {
    return <Badge variant="danger">Out of Stock</Badge>;
  }
  if (currentStock <= minStockLevel) {
    return <Badge variant="warning">Low Stock ({currentStock})</Badge>;
  }
  return <Badge variant="success">In Stock ({currentStock})</Badge>;
}

export function getTransactionBadge(type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT') {
  switch (type) {
    case 'STOCK_IN':
      return <Badge variant="success">+ Receiving (In)</Badge>;
    case 'STOCK_OUT':
      return <Badge variant="danger">- Dispatch (Out)</Badge>;
    case 'ADJUSTMENT':
      return <Badge variant="warning">Audit Adjustment</Badge>;
    default:
      return <Badge variant="neutral">{type}</Badge>;
  }
}
