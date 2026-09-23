/* ==========================================================================
   INVENTRIX - Client-side Web Application JavaScript
   Communicates with Spring Boot REST API on port 8082
   ========================================================================== */

const API_BASE = '/api';

// Application State
let state = {
  products: [],
  categories: [],
  suppliers: [],
  transactions: [],
  lowStockOnly: false,
  searchTerm: '',
  selectedCategory: '',
  selectedSupplier: ''
};

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  await Promise.all([
    loadCategories(),
    loadSuppliers()
  ]);
  await Promise.all([
    loadDashboardStats(),
    loadProducts()
  ]);
}

// ------------------------------------------------------------------
// Toast Notification Utility
// ------------------------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ------------------------------------------------------------------
// Modal Controls
// ------------------------------------------------------------------
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// Close on clicking backdrop
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

// ------------------------------------------------------------------
// 1. Dashboard Statistics
// ------------------------------------------------------------------
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/inventory/statistics`);
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      document.getElementById('stat-total-products').textContent = d.totalProducts;
      document.getElementById('stat-total-units').textContent = Number(d.totalStockUnits).toLocaleString() + ' units';
      document.getElementById('stat-total-valuation').textContent = '₹' + Number(d.totalInventoryValuation).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      
      const lowStockEl = document.getElementById('stat-low-stock');
      lowStockEl.textContent = d.lowStockProducts;
      if (d.lowStockProducts > 0) {
        lowStockEl.style.color = 'var(--accent-amber)';
        document.getElementById('stat-low-stock-sub').textContent = `${d.outOfStockProducts} out of stock!`;
      } else {
        lowStockEl.style.color = 'var(--accent-emerald)';
        document.getElementById('stat-low-stock-sub').textContent = 'All products healthy';
      }
    }
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
  }
}

// ------------------------------------------------------------------
// 2. Categories & Suppliers
// ------------------------------------------------------------------
async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const json = await res.json();
    if (json.success) {
      state.categories = json.data;
      populateCategoryDropdowns();
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

async function loadSuppliers() {
  try {
    const res = await fetch(`${API_BASE}/suppliers`);
    const json = await res.json();
    if (json.success) {
      state.suppliers = json.data;
      populateSupplierDropdowns();
    }
  } catch (err) {
    console.error('Error loading suppliers:', err);
  }
}

function populateCategoryDropdowns() {
  const filterSelect = document.getElementById('category-filter');
  const productSelect = document.getElementById('product-category');
  
  filterSelect.innerHTML = '<option value="">All Categories</option>';
  productSelect.innerHTML = '<option value="">Select Category...</option>';

  state.categories.forEach(cat => {
    filterSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    productSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
  });
}

function populateSupplierDropdowns() {
  const filterSelect = document.getElementById('supplier-filter');
  const productSelect = document.getElementById('product-supplier');

  filterSelect.innerHTML = '<option value="">All Suppliers</option>';
  productSelect.innerHTML = '<option value="">Select Supplier...</option>';

  state.suppliers.forEach(sup => {
    filterSelect.innerHTML += `<option value="${sup.id}">${sup.name}</option>`;
    productSelect.innerHTML += `<option value="${sup.id}">${sup.name}</option>`;
  });
}

// ------------------------------------------------------------------
// 3. Products Catalog & Table Rendering
// ------------------------------------------------------------------
async function loadProducts() {
  try {
    let url = `${API_BASE}/products?`;
    if (state.searchTerm) url += `search=${encodeURIComponent(state.searchTerm)}&`;
    if (state.selectedCategory) url += `categoryId=${state.selectedCategory}&`;
    if (state.selectedSupplier) url += `supplierId=${state.selectedSupplier}&`;
    if (state.lowStockOnly) url += `lowStock=true&`;

    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      state.products = json.data;
      renderProductsTable();
      populateProductSelects();
    }
  } catch (err) {
    console.error('Error loading products:', err);
    showToast('Failed to connect to backend server', 'error');
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('products-table-body');
  if (!state.products || state.products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div>No products found matching the criteria.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.products.map(p => {
    let badgeClass = 'badge-in-stock';
    let badgeText = 'In Stock';
    if (p.currentStock === 0) {
      badgeClass = 'badge-out-of-stock';
      badgeText = 'Out of Stock';
    } else if (p.currentStock <= p.minimumStockLevel) {
      badgeClass = 'badge-low-stock';
      badgeText = `Low Stock (≤ ${p.minimumStockLevel})`;
    }

    return `
      <tr>
        <td><span class="sku-badge">${p.sku}</span></td>
        <td>
          <strong>${escapeHtml(p.name)}</strong>
          ${p.description ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(p.description)}</div>` : ''}
        </td>
        <td><span style="color: var(--text-secondary);">${escapeHtml(p.categoryName || 'Uncategorized')}</span></td>
        <td>
          <div style="font-size: 1.05rem; font-weight: 700;">${p.currentStock} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">${escapeHtml(p.unit || 'pcs')}</span></div>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </td>
        <td>₹${Number(p.purchasePrice).toFixed(2)}</td>
        <td><strong style="color: #a5b4fc;">₹${Number(p.sellingPrice).toFixed(2)}</strong></td>
        <td><span style="color: var(--text-secondary);">${escapeHtml(p.supplierName || '—')}</span></td>
        <td style="text-align: right;">
          <div class="action-btns" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" title="Stock In" onclick="openStockInForProduct(${p.id})">📥 In</button>
            <button class="btn btn-secondary btn-sm" title="Stock Out" onclick="openStockOutForProduct(${p.id})">📤 Out</button>
            <button class="btn btn-secondary btn-sm" title="Edit Product" onclick="openEditProductModal(${p.id})">✏️</button>
            <button class="btn btn-secondary btn-sm" title="Delete Product" onclick="deleteProduct(${p.id}, '${escapeHtml(p.name)}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function populateProductSelects() {
  const inSelect = document.getElementById('stock-in-product');
  const outSelect = document.getElementById('stock-out-product');
  const adjSelect = document.getElementById('adjust-product');

  const options = '<option value="">Select a product...</option>' + 
    state.products.map(p => `<option value="${p.id}">${p.sku} — ${escapeHtml(p.name)} (${p.currentStock} ${p.unit})</option>`).join('');

  if (inSelect) inSelect.innerHTML = options;
  if (outSelect) outSelect.innerHTML = options;
  if (adjSelect) adjSelect.innerHTML = options;
}

// ------------------------------------------------------------------
// Filter & Search Handlers
// ------------------------------------------------------------------
let searchTimeout = null;
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.searchTerm = document.getElementById('search-input').value;
    loadProducts();
  }, 250);
}

function handleFilterChange() {
  state.selectedCategory = document.getElementById('category-filter').value;
  state.selectedSupplier = document.getElementById('supplier-filter').value;
  loadProducts();
}

function toggleLowStockFilter() {
  state.lowStockOnly = !state.lowStockOnly;
  const btn = document.getElementById('btn-low-stock-toggle');
  btn.classList.toggle('active', state.lowStockOnly);
  loadProducts();
}

// ------------------------------------------------------------------
// 4. Stock In Operations
// ------------------------------------------------------------------
function openStockInModal() {
  document.getElementById('stock-in-product').value = '';
  document.getElementById('stock-in-current').value = '-';
  document.getElementById('stock-in-qty').value = '';
  document.getElementById('stock-in-price').value = '';
  document.getElementById('stock-in-result').value = '-';
  document.getElementById('stock-in-notes').value = '';
  openModal('modal-stock-in');
}

function openStockInForProduct(productId) {
  openStockInModal();
  document.getElementById('stock-in-product').value = productId;
  updateStockInPreview();
}

function updateStockInPreview() {
  const pId = document.getElementById('stock-in-product').value;
  const qty = parseInt(document.getElementById('stock-in-qty').value) || 0;
  const product = state.products.find(p => p.id == pId);

  if (product) {
    document.getElementById('stock-in-current').value = `${product.currentStock} ${product.unit}`;
    if (!document.getElementById('stock-in-price').value) {
      document.getElementById('stock-in-price').value = product.purchasePrice;
    }
    const newStock = product.currentStock + qty;
    document.getElementById('stock-in-result').value = `${newStock} ${product.unit}`;
  } else {
    document.getElementById('stock-in-current').value = '-';
    document.getElementById('stock-in-result').value = '-';
  }
}

async function submitStockIn() {
  const productId = document.getElementById('stock-in-product').value;
  const quantity = parseInt(document.getElementById('stock-in-qty').value);
  const unitPrice = parseFloat(document.getElementById('stock-in-price').value) || null;
  const notes = document.getElementById('stock-in-notes').value;

  if (!productId) return showToast('Please select a product', 'warning');
  if (!quantity || quantity <= 0) return showToast('Quantity must be at least 1', 'warning');

  try {
    const res = await fetch(`${API_BASE}/inventory/stock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: Number(productId), quantity, unitPrice, notes })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Stock In recorded! New balance: ${json.data.newStock} units`, 'success');
      closeModal('modal-stock-in');
      await Promise.all([loadProducts(), loadDashboardStats()]);
    } else {
      showToast(json.message || 'Stock In failed', 'error');
    }
  } catch (err) {
    showToast('Network error during Stock In', 'error');
  }
}

// ------------------------------------------------------------------
// 5. Stock Out Operations
// ------------------------------------------------------------------
function openStockOutModal() {
  document.getElementById('stock-out-product').value = '';
  document.getElementById('stock-out-current').value = '-';
  document.getElementById('stock-out-qty').value = '';
  document.getElementById('stock-out-price').value = '';
  document.getElementById('stock-out-result').value = '-';
  document.getElementById('stock-out-notes').value = '';
  openModal('modal-stock-out');
}

function openStockOutForProduct(productId) {
  openStockOutModal();
  document.getElementById('stock-out-product').value = productId;
  updateStockOutPreview();
}

function updateStockOutPreview() {
  const pId = document.getElementById('stock-out-product').value;
  const qty = parseInt(document.getElementById('stock-out-qty').value) || 0;
  const product = state.products.find(p => p.id == pId);

  if (product) {
    document.getElementById('stock-out-current').value = `${product.currentStock} ${product.unit}`;
    if (!document.getElementById('stock-out-price').value) {
      document.getElementById('stock-out-price').value = product.sellingPrice;
    }
    const remaining = product.currentStock - qty;
    const resultEl = document.getElementById('stock-out-result');
    resultEl.value = `${remaining} ${product.unit}`;
    if (remaining < 0) {
      resultEl.style.color = 'var(--accent-rose)';
      resultEl.value += ' ⚠️ INSUFFICIENT STOCK!';
    } else {
      resultEl.style.color = 'var(--text-primary)';
    }
  } else {
    document.getElementById('stock-out-current').value = '-';
    document.getElementById('stock-out-result').value = '-';
  }
}

async function submitStockOut() {
  const productId = document.getElementById('stock-out-product').value;
  const quantity = parseInt(document.getElementById('stock-out-qty').value);
  const unitPrice = parseFloat(document.getElementById('stock-out-price').value) || null;
  const notes = document.getElementById('stock-out-notes').value;

  if (!productId) return showToast('Please select a product', 'warning');
  if (!quantity || quantity <= 0) return showToast('Quantity must be at least 1', 'warning');

  try {
    const res = await fetch(`${API_BASE}/inventory/stock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: Number(productId), quantity, unitPrice, notes })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Stock Out recorded! Remaining: ${json.data.newStock} units`, 'success');
      closeModal('modal-stock-out');
      await Promise.all([loadProducts(), loadDashboardStats()]);
    } else {
      showToast(json.message || 'Stock Out failed', 'error');
    }
  } catch (err) {
    showToast('Network error during Stock Out', 'error');
  }
}

// ------------------------------------------------------------------
// 6. Stock Adjustment (Reconciliation)
// ------------------------------------------------------------------
function openAdjustmentModal() {
  document.getElementById('adjust-product').value = '';
  document.getElementById('adjust-current').value = '-';
  document.getElementById('adjust-count').value = '';
  document.getElementById('adjust-diff').value = '0 units';
  document.getElementById('adjust-notes').value = '';
  openModal('modal-adjustment');
}

function updateAdjustPreview() {
  const pId = document.getElementById('adjust-product').value;
  const count = parseInt(document.getElementById('adjust-count').value);
  const product = state.products.find(p => p.id == pId);

  if (product) {
    document.getElementById('adjust-current').value = `${product.currentStock} ${product.unit}`;
    if (!isNaN(count)) {
      const diff = count - product.currentStock;
      const diffEl = document.getElementById('adjust-diff');
      if (diff > 0) {
        diffEl.value = `Surplus of +${diff} ${product.unit}`;
        diffEl.style.color = 'var(--accent-emerald)';
      } else if (diff < 0) {
        diffEl.value = `Deficit of ${diff} ${product.unit} (Discrepancy)`;
        diffEl.style.color = 'var(--accent-rose)';
      } else {
        diffEl.value = `Matches recorded stock (No variance)`;
        diffEl.style.color = 'var(--text-secondary)';
      }
    }
  }
}

async function submitAdjustment() {
  const productId = document.getElementById('adjust-product').value;
  const newPhysicalCount = parseInt(document.getElementById('adjust-count').value);
  const reason = document.getElementById('adjust-notes').value;

  if (!productId) return showToast('Please select a product', 'warning');
  if (isNaN(newPhysicalCount) || newPhysicalCount < 0) return showToast('Physical count must be 0 or positive', 'warning');
  if (!reason || !reason.trim()) return showToast('Please provide an audit reason', 'warning');

  try {
    const res = await fetch(`${API_BASE}/inventory/adjustment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: Number(productId), newPhysicalCount, reason })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Stock reconciled to ${json.data.newStock} units`, 'success');
      closeModal('modal-adjustment');
      await Promise.all([loadProducts(), loadDashboardStats()]);
    } else {
      showToast(json.message || 'Adjustment failed', 'error');
    }
  } catch (err) {
    showToast('Network error during adjustment', 'error');
  }
}

// ------------------------------------------------------------------
// 7. Product Management (Add/Edit/Delete)
// ------------------------------------------------------------------
function openProductModal() {
  document.getElementById('modal-product-title').textContent = '+ Add New Product';
  document.getElementById('product-id').value = '';
  document.getElementById('product-sku').value = '';
  document.getElementById('product-sku').disabled = false;
  document.getElementById('product-name').value = '';
  document.getElementById('product-desc').value = '';
  document.getElementById('product-category').value = '';
  document.getElementById('product-supplier').value = '';
  document.getElementById('product-cost').value = '';
  document.getElementById('product-selling').value = '';
  document.getElementById('product-initial-stock').value = '0';
  document.getElementById('group-initial-stock').style.display = 'block';
  document.getElementById('product-min-stock').value = '5';
  document.getElementById('product-unit').value = 'pcs';
  openModal('modal-product');
}

function openEditProductModal(id) {
  const product = state.products.find(p => p.id == id);
  if (!product) return;

  document.getElementById('modal-product-title').textContent = '✏️ Edit Product Metadata';
  document.getElementById('product-id').value = product.id;
  document.getElementById('product-sku').value = product.sku;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-desc').value = product.description || '';
  document.getElementById('product-category').value = product.categoryId || '';
  document.getElementById('product-supplier').value = product.supplierId || '';
  document.getElementById('product-cost').value = product.purchasePrice;
  document.getElementById('product-selling').value = product.sellingPrice;
  document.getElementById('group-initial-stock').style.display = 'none'; // Stock is only edited via transactions!
  document.getElementById('product-min-stock').value = product.minimumStockLevel;
  document.getElementById('product-unit').value = product.unit || 'pcs';
  openModal('modal-product');
}

async function submitProduct() {
  const id = document.getElementById('product-id').value;
  const isEdit = Boolean(id);

  const payload = {
    sku: document.getElementById('product-sku').value.trim(),
    name: document.getElementById('product-name').value.trim(),
    description: document.getElementById('product-desc').value.trim(),
    categoryId: document.getElementById('product-category').value ? Number(document.getElementById('product-category').value) : null,
    supplierId: document.getElementById('product-supplier').value ? Number(document.getElementById('product-supplier').value) : null,
    purchasePrice: parseFloat(document.getElementById('product-cost').value) || 0,
    sellingPrice: parseFloat(document.getElementById('product-selling').value),
    minimumStockLevel: parseInt(document.getElementById('product-min-stock').value) || 5,
    unit: document.getElementById('product-unit').value.trim() || 'pcs'
  };

  if (!isEdit) {
    payload.initialStock = parseInt(document.getElementById('product-initial-stock').value) || 0;
  }

  if (!payload.sku) return showToast('SKU is required', 'warning');
  if (!payload.name) return showToast('Product name is required', 'warning');
  if (isNaN(payload.sellingPrice) || payload.sellingPrice < 0) return showToast('Valid selling price is required', 'warning');

  try {
    const url = isEdit ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(isEdit ? 'Product updated successfully' : 'Product registered successfully', 'success');
      closeModal('modal-product');
      await Promise.all([loadProducts(), loadDashboardStats()]);
    } else {
      showToast(json.message || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Network error saving product', 'error');
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete '${name}'?`)) return;

  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`'${name}' deleted successfully`, 'success');
      await Promise.all([loadProducts(), loadDashboardStats()]);
    } else {
      showToast(json.message || 'Failed to delete product', 'error');
    }
  } catch (err) {
    showToast('Network error deleting product', 'error');
  }
}

// ------------------------------------------------------------------
// 8. Audit Transaction History
// ------------------------------------------------------------------
function openTransactionsModal() {
  openModal('modal-transactions');
  loadTransactions();
}

async function loadTransactions() {
  const type = document.getElementById('trx-filter-type').value;
  let url = `${API_BASE}/inventory/transactions?limit=100`;
  if (type) url += `&type=${type}`;

  const tbody = document.getElementById('transactions-table-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading transactions...</td></tr>';

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.success && json.data) {
      if (json.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No transaction logs recorded yet.</td></tr>';
        return;
      }

      tbody.innerHTML = json.data.map(t => {
        let typeBadge = 'badge-in-stock';
        if (t.transactionType === 'STOCK_OUT') typeBadge = 'badge-out-of-stock';
        if (t.transactionType === 'ADJUSTMENT') typeBadge = 'badge-low-stock';

        return `
          <tr>
            <td style="font-size: 0.8rem; color: var(--text-secondary);">${formatDate(t.transactionDate)}</td>
            <td><span class="badge ${typeBadge}">${t.transactionType}</span></td>
            <td>
              <strong>${escapeHtml(t.productName || 'Unknown')}</strong>
              <div style="font-size: 0.75rem;" class="sku-badge">${t.productSku}</div>
            </td>
            <td><strong>${t.transactionType === 'STOCK_OUT' ? '-' : '+'}${t.quantity}</strong></td>
            <td><span style="color: var(--text-muted);">${t.previousStock}</span> → <strong style="color: var(--text-primary);">${t.newStock}</strong></td>
            <td>₹${Number(t.unitPrice).toFixed(2)}</td>
            <td style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(t.referenceNotes || '—')}</td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Error loading transaction history</td></tr>';
  }
}

// ------------------------------------------------------------------
// 9. Categories Management Modal
// ------------------------------------------------------------------
function openCategoriesModal() {
  openModal('modal-categories');
  renderCategoriesList();
}

function renderCategoriesList() {
  const tbody = document.getElementById('categories-table-body');
  if (state.categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No categories defined</td></tr>';
    return;
  }
  tbody.innerHTML = state.categories.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(c.description || '—')}</td>
      <td><span class="badge badge-in-stock">${c.productCount} items</span></td>
      <td style="text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="deleteCategory(${c.id}, '${escapeHtml(c.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function submitCategory(e) {
  e.preventDefault();
  const name = document.getElementById('new-category-name').value.trim();
  const description = document.getElementById('new-category-desc').value.trim();

  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Category '${name}' created!`, 'success');
      document.getElementById('new-category-name').value = '';
      document.getElementById('new-category-desc').value = '';
      await loadCategories();
      renderCategoriesList();
      loadProducts();
    } else {
      showToast(json.message || 'Failed to create category', 'error');
    }
  } catch (err) {
    showToast('Network error creating category', 'error');
  }
}

async function deleteCategory(id, name) {
  if (!confirm(`Delete category '${name}'?`)) return;
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Category '${name}' deleted`, 'success');
      await loadCategories();
      renderCategoriesList();
      loadProducts();
    } else {
      showToast(json.message || 'Cannot delete category with linked products', 'error');
    }
  } catch (err) {
    showToast('Network error deleting category', 'error');
  }
}

// ------------------------------------------------------------------
// 10. Suppliers Management Modal
// ------------------------------------------------------------------
function openSuppliersModal() {
  openModal('modal-suppliers');
  renderSuppliersList();
}

function renderSuppliersList() {
  const tbody = document.getElementById('suppliers-table-body');
  if (state.suppliers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No suppliers defined</td></tr>';
    return;
  }
  tbody.innerHTML = state.suppliers.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td style="color: var(--text-secondary);">${escapeHtml(s.contactPerson || '—')}</td>
      <td style="font-size: 0.85rem;">${escapeHtml(s.phone || '—')}</td>
      <td style="font-size: 0.85rem; color: #a5b4fc;">${escapeHtml(s.email || '—')}</td>
      <td style="text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="deleteSupplier(${s.id}, '${escapeHtml(s.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function submitSupplier(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('new-supplier-name').value.trim(),
    contactPerson: document.getElementById('new-supplier-contact').value.trim(),
    phone: document.getElementById('new-supplier-phone').value.trim(),
    email: document.getElementById('new-supplier-email').value.trim(),
    address: document.getElementById('new-supplier-address').value.trim()
  };

  try {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Supplier '${payload.name}' added!`, 'success');
      e.target.reset();
      await loadSuppliers();
      renderSuppliersList();
      loadProducts();
    } else {
      showToast(json.message || 'Failed to add supplier', 'error');
    }
  } catch (err) {
    showToast('Network error adding supplier', 'error');
  }
}

async function deleteSupplier(id, name) {
  if (!confirm(`Delete supplier '${name}'?`)) return;
  try {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Supplier '${name}' deleted`, 'success');
      await loadSuppliers();
      renderSuppliersList();
      loadProducts();
    } else {
      showToast(json.message || 'Failed to delete supplier', 'error');
    }
  } catch (err) {
    showToast('Network error deleting supplier', 'error');
  }
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
