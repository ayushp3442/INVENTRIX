'use client';
/** features/sales/presentation/SalesScreen.tsx */
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/core/auth/AuthContext';
import { salesRepository } from '../data/salesRepository';
import { CartItem, CompletedSaleBill } from '../domain/types';
import { Product } from '@/features/products/domain/types';
import { formatCurrency, formatDateTime } from '@/core/utils/formatters';
import { ROUTES } from '@/core/constants/routes';
import {
  X,
  ShoppingCart,
  MinusCircle,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  Package,
  Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Async toast helper to prevent React 19 cross-component render state updates
const notify = {
  success: (msg: string) => setTimeout(() => toast.success(msg), 0),
  error: (msg: string) => setTimeout(() => toast.error(msg), 0),
};

export function SalesScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form State (Add to Cart)
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Bill / Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [referenceNotes, setReferenceNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal State
  const [receipt, setReceipt] = useState<CompletedSaleBill | null>(null);

  // Auth protection
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace(ROUTES.LOGIN);
    }
  }, [user, authLoading]);

  // Load products on mount
  useEffect(() => {
    async function load() {
      try {
        setLoadingProducts(true);
        const data = await salesRepository.getProducts();
        setProducts(data);
      } catch (err: unknown) {
        notify.error((err as Error).message ?? 'Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    }
    load();
  }, []);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === Number(selectedProductId)) ?? null;
  }, [selectedProductId, products]);

  // Handle adding to cart
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      notify.error('Please select a product first.');
      return;
    }
    if (quantity <= 0) {
      notify.error('Quantity must be at least 1.');
      return;
    }
    if (quantity > selectedProduct.currentStock) {
      notify.error(`Only ${selectedProduct.currentStock} ${selectedProduct.unit} available in stock.`);
      return;
    }

    const existing = cart.find((item) => item.productId === selectedProduct.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > selectedProduct.currentStock) {
        notify.error(`Total quantity in bill (${newQty}) exceeds available stock (${selectedProduct.currentStock}).`);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.productId === selectedProduct.id
            ? { ...item, quantity: newQty, subtotal: item.unitPrice * newQty }
            : item
        )
      );
      notify.success(`Updated ${selectedProduct.name} quantity in bill!`);
    } else {
      const newItem: CartItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        sku: selectedProduct.sku,
        unit: selectedProduct.unit,
        availableStock: selectedProduct.currentStock,
        unitPrice: Number(selectedProduct.sellingPrice),
        quantity: quantity,
        subtotal: Number(selectedProduct.sellingPrice) * quantity,
      };
      setCart((prev) => [...prev, newItem]);
      notify.success(`Added ${selectedProduct.name} to bill!`);
    }

    // Reset quantity input
    setQuantity(1);
  };

  // Adjust item quantity inside cart
  const handleUpdateCartQty = (productId: number, delta: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    if (newQty > item.availableStock) {
      notify.error(`Maximum available stock reached (${item.availableStock}).`);
      return;
    }

    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: newQty, subtotal: i.unitPrice * newQty }
          : i
      )
    );
  };

  // Remove item from cart
  const handleRemoveItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    notify.success('Item removed from bill');
  };

  // Calculate bill total
  const totalPayable = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  // Complete the transaction
  const handleCompleteTransaction = async () => {
    if (cart.length === 0) {
      notify.error('The bill is empty. Please add items first.');
      return;
    }

    try {
      setSubmitting(true);
      const billNumber = `INV-${Date.now().toString().slice(-6)}`;
      const payload = {
        customerName: customerName.trim() || 'Walk-in Customer',
        referenceNotes: referenceNotes.trim() || `POS Sale Bill #${billNumber}`,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: `POS Sale - Bill #${billNumber}`,
        })),
      };

      await salesRepository.completeSale(payload);

      // Save receipt details for modal
      setReceipt({
        billNumber,
        date: new Date().toISOString(),
        customerName: customerName.trim() || 'Walk-in Customer',
        items: [...cart],
        totalAmount: totalPayable,
      });

      notify.success('Transaction Completed Successfully! 🎉');
      setCart([]);
      setSelectedProductId('');
      setQuantity(1);
      setCustomerName('');
      setReferenceNotes('');

      // Refresh product stock list in background
      const refreshed = await salesRepository.getProducts();
      setProducts(refreshed);
    } catch (err: unknown) {
      notify.error((err as Error).message ?? 'Failed to complete transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(ROUTES.DASHBOARD)}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close and return to dashboard"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              New Transaction
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Register
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(ROUTES.PRODUCTS)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-slate-500" />
            Product Catalog
          </button>
          <button
            onClick={() => router.push(ROUTES.LEDGER)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            Audit Ledger
          </button>
        </div>
      </header>

      {/* Main Two-Column POS Layout */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: Add to Cart ================= */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Add to Cart</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select product and quantity to add to the current bill.
              </p>
            </div>

            <form onSubmit={handleAddToCart} className="space-y-4">
              {/* Product Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Product
                </label>
                <div className="relative">
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedProductId(val ? Number(val) : '');
                      setQuantity(1);
                    }}
                    disabled={loadingProducts}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all cursor-pointer disabled:bg-slate-100"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={p.currentStock <= 0}
                      >
                        {p.name} ({p.sku}) — {formatCurrency(p.sellingPrice)} [{p.currentStock} {p.unit} in stock]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Live Info Preview */}
              {selectedProduct ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">SKU / Code:</span>
                    <span className="font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {selectedProduct.sku}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Unit Selling Price:</span>
                    <span className="font-bold text-indigo-700 text-sm">
                      {formatCurrency(selectedProduct.sellingPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Current Available Stock:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        selectedProduct.currentStock > 5
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : selectedProduct.currentStock > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {selectedProduct.currentStock > 0
                        ? `${selectedProduct.currentStock} ${selectedProduct.unit} available`
                        : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Quantity Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Quantity
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={!selectedProduct || quantity <= 1}
                    className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 font-bold transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct ? selectedProduct.currentStock : 9999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={!selectedProduct || selectedProduct.currentStock <= 0}
                    required
                    placeholder="Quantity"
                    className="flex-1 px-3.5 py-2.5 text-center text-sm font-semibold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        selectedProduct ? Math.min(selectedProduct.currentStock, q + 1) : q + 1
                      )
                    }
                    disabled={
                      !selectedProduct ||
                      quantity >= (selectedProduct.currentStock || 0) ||
                      selectedProduct.currentStock <= 0
                    }
                    className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 font-bold transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calculated Subtotal Preview */}
              {selectedProduct ? (
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 pt-1">
                  <span>Item Subtotal:</span>
                  <span className="font-extrabold text-sm text-slate-900">
                    {formatCurrency(Number(selectedProduct.sellingPrice) * quantity)}
                  </span>
                </div>
              ) : null}

              {/* Add to Bill Button */}
              <button
                type="submit"
                disabled={
                  !selectedProduct ||
                  selectedProduct.currentStock <= 0 ||
                  quantity <= 0
                }
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Bill
              </button>
            </form>
          </div>

          {/* ================= RIGHT COLUMN: Current Bill ================= */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Current Bill</h2>
                  <p className="text-xs text-slate-500">Review items before completing transaction</p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto min-h-[220px]">
                {cart.length === 0 ? (
                  <div className="h-56 flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No items added yet</p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Choose a product from the left and click "Add to Bill" to create an invoice.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {cart.map((item) => (
                        <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 max-w-[180px] truncate">
                            {item.productName}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                            {item.sku}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-700">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.productId, -1)}
                                className="text-slate-500 hover:text-slate-800 font-bold px-1 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-bold text-slate-900 min-w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQty(item.productId, 1)}
                                className="text-slate-500 hover:text-slate-800 font-bold px-1 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Customer & Bill Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Customer / Counter Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Walk-in Customer"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Reference / Invoice Notes
                  </label>
                  <input
                    type="text"
                    value={referenceNotes}
                    onChange={(e) => setReferenceNotes(e.target.value)}
                    placeholder="e.g. Paid in Cash / UPI"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Total Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Amount Payable
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Includes all unit pricing and stock deductions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
                    {formatCurrency(totalPayable)}
                  </p>
                </div>
              </div>

              {/* Complete Transaction Button */}
              <button
                type="button"
                onClick={handleCompleteTransaction}
                disabled={cart.length === 0 || submitting}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {submitting ? 'Recording Sale & Updating Stock...' : 'Complete Transaction'}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ================= SUCCESS RECEIPT MODAL ================= */}
      {receipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="text-center space-y-2 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Transaction Completed!
              </h3>
              <p className="text-xs text-slate-500">
                Invoice <span className="font-mono font-bold text-slate-700">#{receipt.billNumber}</span> recorded in ACID ledger
              </p>
            </div>

            {/* Receipt Summary Details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-bold text-slate-900">{receipt.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date / Time:</span>
                <span className="font-mono text-slate-700">{formatDateTime(receipt.date)}</span>
              </div>

              {/* Items List in Receipt */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.items.map((it) => (
                      <tr key={it.productId}>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {it.productName}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700">
                          {it.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Paid */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-800">Total Paid:</span>
                <span className="text-xl font-extrabold text-emerald-700">
                  {formatCurrency(receipt.totalAmount)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}