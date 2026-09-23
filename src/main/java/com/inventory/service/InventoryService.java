package com.inventory.service;

import com.inventory.dto.CategoryBreakdownDto;
import com.inventory.dto.InventoryStatsResponse;
import com.inventory.dto.StockAdjustmentRequest;
import com.inventory.dto.StockInRequest;
import com.inventory.dto.StockOutRequest;
import com.inventory.dto.SaleBillRequest;
import com.inventory.exception.BadRequestException;
import com.inventory.exception.InsufficientStockException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.InventoryTransaction;
import com.inventory.model.Product;
import com.inventory.repository.CategoryRepository;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.SupplierRepository;
import com.inventory.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service managing transactional inventory operations with an audited transaction history.
 * Concurrency safety is enforced using PostgreSQL row-level locking (SELECT ... FOR UPDATE)
 * within database transactions.
 */
@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    public InventoryService(ProductRepository productRepository,
                            TransactionRepository transactionRepository,
                            CategoryRepository categoryRepository,
                            SupplierRepository supplierRepository) {
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
    }

    /**
     * Atomically executes a STOCK_IN operation with row-level locking:
     * 1. Acquires row lock via SELECT ... FOR UPDATE
     * 2. Validates positive quantity and product existence
     * 3. Calculates new stock = previousStock + quantity
     * 4. Updates product stock in PostgreSQL
     * 5. Appends audited ledger transaction
     * 6. Commits both atomically
     */
    @Transactional
    public InventoryTransaction recordStockIn(StockInRequest request) {
        if (request.getProductId() == null) {
            throw new BadRequestException("Product ID is required");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new BadRequestException("Stock in quantity must be greater than zero");
        }

        // Row-level lock ensures no concurrent stock updates overwrite this operation
        Product product = productRepository.findByIdForUpdate(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        int previousStock = product.getCurrentStock();
        int newStock = previousStock + request.getQuantity();

        // 1. Update product stock (also sets updated_at = CURRENT_TIMESTAMP)
        productRepository.updateStock(product.getId(), newStock);

        // 2. Insert into audit ledger
        InventoryTransaction trx = new InventoryTransaction();
        trx.setProductId(product.getId());
        trx.setTransactionType("STOCK_IN");
        trx.setQuantity(request.getQuantity());
        trx.setUnitPrice(request.getUnitPrice() != null ? request.getUnitPrice() : product.getPurchasePrice());
        trx.setPreviousStock(previousStock);
        trx.setNewStock(newStock);
        trx.setReferenceNotes(request.getNotes() != null && !request.getNotes().trim().isEmpty() 
                ? request.getNotes().trim() : "Standard Stock In / Restock");

        return transactionRepository.save(trx);
    }

    /**
     * Atomically executes a STOCK_OUT operation with row-level locking:
     * 1. Acquires row lock via SELECT ... FOR UPDATE
     * 2. Validates positive quantity and product availability
     * 3. Throws InsufficientStockException if quantity > current stock
     * 4. Calculates new stock = previousStock - quantity
     * 5. Updates product stock in PostgreSQL
     * 6. Appends audited ledger transaction
     * 7. Commits both atomically
     */
    @Transactional
    public InventoryTransaction recordStockOut(StockOutRequest request) {
        if (request.getProductId() == null) {
            throw new BadRequestException("Product ID is required");
        }
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new BadRequestException("Stock out quantity must be greater than zero");
        }

        // Row-level lock ensures accurate real-time inventory validation
        Product product = productRepository.findByIdForUpdate(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        int previousStock = product.getCurrentStock();
        if (previousStock < request.getQuantity()) {
            throw new InsufficientStockException(
                    String.format("Insufficient stock for '%s' (SKU: %s). Available: %d %s, Requested: %d %s",
                            product.getName(), product.getSku(), previousStock, product.getUnit(), request.getQuantity(), product.getUnit()));
        }

        int newStock = previousStock - request.getQuantity();

        // 1. Update product stock (also sets updated_at = CURRENT_TIMESTAMP)
        productRepository.updateStock(product.getId(), newStock);

        // 2. Insert into audit ledger
        InventoryTransaction trx = new InventoryTransaction();
        trx.setProductId(product.getId());
        trx.setTransactionType("STOCK_OUT");
        trx.setQuantity(request.getQuantity());
        trx.setUnitPrice(request.getUnitPrice() != null ? request.getUnitPrice() : product.getSellingPrice());
        trx.setPreviousStock(previousStock);
        trx.setNewStock(newStock);
        trx.setReferenceNotes(request.getNotes() != null && !request.getNotes().trim().isEmpty() 
                ? request.getNotes().trim() : "Standard Stock Out / Dispatch");

        return transactionRepository.save(trx);
    }
    /**
     * Atomically executes a multi-item sales bill:
     * Validates and deducts stock for every cart item under a single transaction.
     */
    @Transactional
    public List<InventoryTransaction> recordSaleBill(SaleBillRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Sale bill must contain at least one item");
        }
        List<InventoryTransaction> transactions = new java.util.ArrayList<>();
        String billRef = "Sale Bill #" + (System.currentTimeMillis() % 1000000);
        if (request.getCustomerName() != null && !request.getCustomerName().trim().isEmpty()) {
            billRef += " - " + request.getCustomerName().trim();
        }

        for (StockOutRequest item : request.getItems()) {
            if (item.getNotes() == null || item.getNotes().trim().isEmpty()) {
                item.setNotes(billRef);
            }
            transactions.add(recordStockOut(item));
        }
        return transactions;
    }

    /**
     * Reconciles physical count with system stock (audit adjustments) with row-level locking:
     * 1. Acquires row lock via SELECT ... FOR UPDATE
     * 2. Validates physical count >= 0 and mandatory reason
     * 3. Rejects no-op adjustments (physical count == current stock)
     * 4. Updates product stock to matched physical count
     * 5. Appends audited ledger transaction with discrepancy notes
     */
    @Transactional
    public InventoryTransaction recordAdjustment(StockAdjustmentRequest request) {
        if (request.getProductId() == null) {
            throw new BadRequestException("Product ID is required");
        }
        if (request.getNewPhysicalCount() == null || request.getNewPhysicalCount() < 0) {
            throw new BadRequestException("Physical count must be zero or positive");
        }
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new BadRequestException("Adjustment reason is mandatory");
        }

        // Row-level lock guarantees consistent delta calculation
        Product product = productRepository.findByIdForUpdate(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        int previousStock = product.getCurrentStock();
        int newStock = request.getNewPhysicalCount();
        int diff = newStock - previousStock;

        if (diff == 0) {
            throw new BadRequestException("New physical count (" + newStock + ") matches current system stock. No adjustment needed.");
        }

        // 1. Update product stock (also sets updated_at = CURRENT_TIMESTAMP)
        productRepository.updateStock(product.getId(), newStock);

        // 2. Insert into audit ledger
        InventoryTransaction trx = new InventoryTransaction();
        trx.setProductId(product.getId());
        trx.setTransactionType("ADJUSTMENT");
        trx.setQuantity(Math.abs(diff));
        trx.setUnitPrice(product.getPurchasePrice());
        trx.setPreviousStock(previousStock);
        trx.setNewStock(newStock);

        String direction = diff > 0 ? "Reconciled surplus (+" + diff + "): " : "Reconciled deficit (" + diff + "): ";
        trx.setReferenceNotes(direction + request.getReason().trim());

        return transactionRepository.save(trx);
    }

    public List<InventoryTransaction> getTransactions(Long productId, String type, Integer limit) {
        return transactionRepository.findAll(productId, type, limit);
    }

    public InventoryTransaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));
    }

    public InventoryStatsResponse getStatistics() {
        InventoryStatsResponse stats = new InventoryStatsResponse();
        stats.setTotalProducts(productRepository.count());
        stats.setTotalCategories(categoryRepository.findAll().size());
        stats.setTotalSuppliers(supplierRepository.findAll().size());
        stats.setTotalStockUnits(productRepository.getTotalStockUnits());
        stats.setLowStockProducts(productRepository.countLowStock());
        stats.setOutOfStockProducts(productRepository.countOutOfStock());
        stats.setTotalInventoryValuation(productRepository.getTotalValuation());
        return stats;
    }

    public List<CategoryBreakdownDto> getCategoryBreakdown() {
        return categoryRepository.getCategoryBreakdown();
    }
}
