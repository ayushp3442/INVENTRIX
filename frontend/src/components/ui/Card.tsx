import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        'bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs transition-shadow',
        className
      )}
    >
      {children}
    </div>
  );
};
