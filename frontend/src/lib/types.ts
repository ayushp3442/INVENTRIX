export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  supplierId?: number;
  supplierName?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStockLevel: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  productCount?: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  productName?: string;
  productSku?: string;
  transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
  quantity: number;
  unitPrice: number;
  previousStock: number;
  newStock: number;
  referenceNotes?: string;
  transactionDate: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalStockUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValuation: number;
}

export interface CategoryBreakdown {
  categoryId: number;
  categoryName: string;
  totalStock: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  supplierId?: number;
  purchasePrice: number;
  sellingPrice: number;
  minimumStockLevel: number;
  unit: string;
  initialStock?: number;
}

export interface StockInRequest {
  productId: number;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface StockOutRequest {
  productId: number;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface StockAdjustmentRequest {
  productId: number;
  newPhysicalCount: number;
  reason: string;
}

export type UserRole = 'ADMIN' | 'STAFF';

export interface UserSession {
  username: string;
  name: string;
  role: UserRole;
}
