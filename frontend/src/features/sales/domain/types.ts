/** features/sales/domain/types.ts */
export interface CartItem {
  productId: number;
  productName: string;
  sku: string;
  unit: string;
  availableStock: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SaleBillItemDto {
  productId: number;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface SaleBillRequestDto {
  customerName?: string;
  referenceNotes?: string;
  items: SaleBillItemDto[];
}

export interface CompletedSaleBill {
  billNumber: string;
  date: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
}