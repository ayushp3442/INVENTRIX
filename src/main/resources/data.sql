-- ============================================================
-- INVENTRIX - POSTGRESQL SEED DATA
-- ============================================================

-- 1. Insert Categories
INSERT INTO categories (id, name, description) 
SELECT 1, 'Electronics & Gadgets', 'Computing hardware, accessories, peripherals'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 1);

INSERT INTO categories (id, name, description) 
SELECT 2, 'Office Stationery', 'Paper, pens, files, desk supplies'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 2);

INSERT INTO categories (id, name, description) 
SELECT 3, 'Furniture & Storage', 'Office chairs, desks, storage racks'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 3);

-- 2. Insert Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address)
SELECT 1, 'Logitech Distribution Ltd', 'Robert Fox', '+91 98765 43210', 'sales@logitech-dist.com', 'Plot 45, Tech Park, Bangalore'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE id = 1);

INSERT INTO suppliers (id, name, contact_person, phone, email, address)
SELECT 2, 'Staples Wholesale Supplies', 'Anita Sharma', '+91 91234 56789', 'orders@staples-wholesale.in', 'Sector 18, Gurugram, Haryana'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE id = 2);

INSERT INTO suppliers (id, name, contact_person, phone, email, address)
SELECT 3, 'Godrej Interio Enterprises', 'Vikram Mehra', '+91 99887 76655', 'contact@godrej-interio.com', 'Andheri East, Mumbai, Maharashtra'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE id = 3);

-- 3. Insert Clean Genuine Products
INSERT INTO products (id, sku, name, description, category_id, supplier_id, purchase_price, selling_price, current_stock, minimum_stock_level, unit)
SELECT 1, 'ELC-KB-101', 'Logitech Wireless Keyboard MK270', 'Compact wireless keyboard with long battery life', 1, 1, 1200.00, 1699.00, 25, 5, 'pcs'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 1);

INSERT INTO products (id, sku, name, description, category_id, supplier_id, purchase_price, selling_price, current_stock, minimum_stock_level, unit)
SELECT 2, 'ELC-MS-202', 'Logitech Optical Mouse B170', '2.4GHz wireless optical mouse with USB nano receiver', 1, 1, 450.00, 699.00, 15, 5, 'pcs'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 2);

INSERT INTO products (id, sku, name, description, category_id, supplier_id, purchase_price, selling_price, current_stock, minimum_stock_level, unit)
SELECT 3, 'STA-PR-303', 'JK Copier Paper A4 (75 GSM)', 'Ream of 500 sheets for laser and inkjet printers', 2, 2, 280.00, 380.00, 50, 15, 'reams'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 3);

INSERT INTO products (id, sku, name, description, category_id, supplier_id, purchase_price, selling_price, current_stock, minimum_stock_level, unit)
SELECT 4, 'FUR-CH-404', 'Ergonomic Mesh Office Chair', 'High back adjustable lumbar support revolving chair', 3, 3, 4500.00, 6499.00, 8, 3, 'pcs'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 4);

INSERT INTO products (id, sku, name, description, category_id, supplier_id, purchase_price, selling_price, current_stock, minimum_stock_level, unit)
SELECT 5, 'STA-PN-505', 'Gel Pen Box (Pack of 20)', 'Smooth writing waterproof blue gel ink pens', 2, 2, 120.00, 200.00, 20, 5, 'box'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 5);

-- 4. Insert Initial Transactions Ledger
INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, unit_price, previous_stock, new_stock, reference_notes, transaction_date)
SELECT 1, 1, 'STOCK_IN', 25, 1200.00, 0, 25, 'Initial Opening Stock - PO#1001', CURRENT_TIMESTAMP - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE id = 1);

INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, unit_price, previous_stock, new_stock, reference_notes, transaction_date)
SELECT 2, 2, 'STOCK_IN', 20, 450.00, 0, 20, 'Initial Opening Stock - PO#1002', CURRENT_TIMESTAMP - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE id = 2);

INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, unit_price, previous_stock, new_stock, reference_notes, transaction_date)
SELECT 3, 2, 'STOCK_OUT', 5, 699.00, 20, 15, 'Retail Customer Sale - Invoice #INV-501', CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE id = 3);

INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, unit_price, previous_stock, new_stock, reference_notes, transaction_date)
SELECT 4, 3, 'STOCK_IN', 50, 280.00, 0, 50, 'Bulk Restock from Staples Wholesale', CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE id = 4);

INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, unit_price, previous_stock, new_stock, reference_notes, transaction_date)
SELECT 5, 4, 'STOCK_IN', 10, 4500.00, 0, 10, 'Delivery Challan - Godrej Interio #DC-88', CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE id = 5);

INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, unit_price, previous_stock, new_stock, reference_notes, transaction_date)
SELECT 6, 4, 'STOCK_OUT', 2, 6499.00, 10, 8, 'Corporate Office Order - PO#CORP-22', CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE id = 6);

INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, unit_price, previous_stock, new_stock, reference_notes, transaction_date)
SELECT 7, 5, 'STOCK_IN', 20, 120.00, 0, 20, 'Opening Stock - Staples Supplies', CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM inventory_transactions WHERE id = 7);

-- Synchronize identity sequences past existing IDs
SELECT setval(pg_get_serial_sequence('categories', 'id'), 10, false);
SELECT setval(pg_get_serial_sequence('suppliers', 'id'), 10, false);
SELECT setval(pg_get_serial_sequence('products', 'id'), 10, false);
SELECT setval(pg_get_serial_sequence('inventory_transactions', 'id'), 10, false);