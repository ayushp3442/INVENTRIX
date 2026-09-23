'use client';

import { useEffect } from 'react';
import { useAuth } from '@/core/auth/AuthContext';
import { ROUTES } from '@/core/constants/routes';

export default function RootPage() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        window.location.replace(ROUTES.DASHBOARD);
      } else {
        window.location.replace(ROUTES.LOGIN);
      }
    }
  }, [user, isLoading]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}