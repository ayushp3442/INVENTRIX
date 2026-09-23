# INVENTRIX — General-Purpose Inventory Management System

A modular inventory management system built with **Java 21**, **Spring Boot 3.3.4**, **Spring JDBC (JdbcTemplate)**, and **PostgreSQL 16**, paired with a **Next.js** frontend.

---

## 1. Architectural Principles

- **Framework**: Spring Boot 3.3.4 (Java 21 LTS)
- **Data Access Layer**: Spring JDBC (`JdbcTemplate`) — **Strictly NO JPA / Hibernate / Spring Data JPA**. Direct SQL control ensures explicit, deterministic queries and full predictability.
- **Relational Database**: PostgreSQL 16 exclusively.
- **Transaction Management**: Spring `@Transactional` with row-level locks (`SELECT ... FOR UPDATE`) guarantees concurrency-safe stock updates without lost updates.
- **Auditability**: Every stock mutation produces a corresponding entry in the audited `inventory_transactions` history ledger.
- **Frontend Architecture**: Next.js App Router (TypeScript, Tailwind CSS, Lucide Icons, Recharts) with client-side role simulation (Administrator vs Warehouse Operator).

---

## 2. Database Schema (PostgreSQL)

The system manages 4 relational tables:

1. **`categories`**: Product classifications (`ON DELETE SET NULL` on referencing products).
2. **`suppliers`**: Vendor and contact records (`ON DELETE SET NULL` on referencing products).
3. **`products`**: Product catalog, cost and selling prices, current stock, and reorder levels.
4. **`inventory_transactions`**: Audit trail of all stock movements (`STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`) with `ON DELETE RESTRICT` on products to preserve historical integrity.

---

## 3. Concurrency & Business Rules

### Concurrency Protection
To prevent lost updates when concurrent requests modify the same product's stock:
1. `SELECT ... FOR UPDATE` acquires a row lock on the product record.
2. Stock rules are validated against the locked record.
3. The stock count is updated in `products` (with `updated_at = CURRENT_TIMESTAMP`).
4. A transaction entry is inserted into `inventory_transactions`.
5. Both operations commit together in a single database transaction. If either fails, the entire transaction rolls back.

### Business Rules
- **Stock In (Receiving)**: `newStock = previousStock + quantity` (quantity must be > 0).
- **Stock Out (Dispatch)**: `newStock = previousStock - quantity` (quantity must be > 0; rejected if quantity > current stock).
- **Stock Adjustment (Audit Reconciliation)**: `newStock = physicalCount` (physical count >= 0; reason is mandatory; no-op adjustments where physicalCount == currentStock are rejected).
- **Deletion Protection**: Products with transaction history cannot be deleted; attempting to do so returns HTTP 400 Bad Request with an informative message.

---

## 4. Role Differentiation (Demo Simulation)

The application provides a simulated role switcher for demonstration:
- **Administrator**: Full access to create, edit, and delete products, categories, and suppliers; perform stock operations; view audit ledgers and analytical dashboards.
- **Warehouse Operator (Staff)**: Operational inventory access — execute Stock In/Out and Adjustment operations, view catalog, transaction history, and dashboard metrics. Administrative create/edit/delete actions are restricted.

---

## 5. Running the Application

### Prerequisites
- Java 21 JDK
- PostgreSQL 16 (running on port `5432` with database `inventory_db`)
- Node.js 18+ & npm

### Starting the Backend
```bash
# In project root
./mvnw clean spring-boot:run
```
The backend starts on `http://localhost:8082`.

### Starting the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:3000`.
