import {
  Product,
  Category,
  Supplier,
  InventoryTransaction,
  InventoryStats,
  CategoryBreakdown,
  ApiResponse,
  ProductRequest,
  StockInRequest,
  StockOutRequest,
  StockAdjustmentRequest,
} from './types';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const body: ApiResponse<T> = await res.json();

  if (!res.ok || !body.success) {
    const errorMsg = body.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return body.data;
}

// ==================== PRODUCTS ====================
export async function getProducts(params?: {
  search?: string;
  categoryId?: number;
  supplierId?: number;
  lowStock?: boolean;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.categoryId) query.set('categoryId', params.categoryId.toString());
  if (params?.supplierId) query.set('supplierId', params.supplierId.toString());
  if (params?.lowStock) query.set('lowStock', 'true');

  const queryString = query.toString();
  return fetchJson<Product[]>(`${BASE_URL}/products${queryString ? `?${queryString}` : ''}`);
}

export async function getProductById(id: number): Promise<Product> {
  return fetchJson<Product>(`${BASE_URL}/products/${id}`);
}

export async function createProduct(request: ProductRequest): Promise<Product> {
  return fetchJson<Product>(`${BASE_URL}/products`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateProduct(id: number, request: ProductRequest): Promise<Product> {
  return fetchJson<Product>(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  return fetchJson<void>(`${BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
}

// ==================== INVENTORY OPERATIONS ====================
export async function recordStockIn(request: StockInRequest): Promise<InventoryTransaction> {
  return fetchJson<InventoryTransaction>(`${BASE_URL}/inventory/stock-in`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function recordStockOut(request: StockOutRequest): Promise<InventoryTransaction> {
  return fetchJson<InventoryTransaction>(`${BASE_URL}/inventory/stock-out`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function recordAdjustment(request: StockAdjustmentRequest): Promise<InventoryTransaction> {
  return fetchJson<InventoryTransaction>(`${BASE_URL}/inventory/adjustment`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getTransactions(
  productId?: number,
  type?: string,
  limit: number = 100
): Promise<InventoryTransaction[]> {
  const query = new URLSearchParams();
  if (productId) query.set('productId', productId.toString());
  if (type) query.set('type', type);
  query.set('limit', limit.toString());

  return fetchJson<InventoryTransaction[]>(`${BASE_URL}/inventory/transactions?${query.toString()}`);
}

export async function getStatistics(): Promise<InventoryStats> {
  return fetchJson<InventoryStats>(`${BASE_URL}/inventory/statistics`);
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  return fetchJson<CategoryBreakdown[]>(`${BASE_URL}/inventory/category-breakdown`);
}

// ==================== CATEGORIES ====================
export async function getCategories(): Promise<Category[]> {
  return fetchJson<Category[]>(`${BASE_URL}/categories`);
}

export async function createCategory(category: Partial<Category>): Promise<Category> {
  return fetchJson<Category>(`${BASE_URL}/categories`, {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

export async function updateCategory(id: number, category: Partial<Category>): Promise<Category> {
  return fetchJson<Category>(`${BASE_URL}/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  return fetchJson<void>(`${BASE_URL}/categories/${id}`, {
    method: 'DELETE',
  });
}

// ==================== SUPPLIERS ====================
export async function getSuppliers(): Promise<Supplier[]> {
  return fetchJson<Supplier[]>(`${BASE_URL}/suppliers`);
}

export async function createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  return fetchJson<Supplier>(`${BASE_URL}/suppliers`, {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
}

export async function updateSupplier(id: number, supplier: Partial<Supplier>): Promise<Supplier> {
  return fetchJson<Supplier>(`${BASE_URL}/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplier),
  });
}

export async function deleteSupplier(id: number): Promise<void> {
  return fetchJson<void>(`${BASE_URL}/suppliers/${id}`, {
    method: 'DELETE',
  });
}
