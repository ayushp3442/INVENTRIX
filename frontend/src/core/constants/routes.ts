/** core/constants/routes.ts - single source of truth for all route paths */
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  SALES: '/sales',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  SUPPLIERS: '/suppliers',
  STOCK_OPERATIONS: '/stock-operations',
  LEDGER: '/ledger',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];