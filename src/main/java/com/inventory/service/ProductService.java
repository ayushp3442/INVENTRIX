package com.inventory.service;

import com.inventory.dto.ProductRequest;
import com.inventory.exception.BadRequestException;
import com.inventory.exception.DuplicateSkuException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.Category;
import com.inventory.model.InventoryTransaction;
import com.inventory.model.Product;
import com.inventory.model.Supplier;
import com.inventory.repository.CategoryRepository;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.SupplierRepository;
import com.inventory.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final TransactionRepository transactionRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          SupplierRepository supplierRepository,
                          TransactionRepository transactionRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<Product> getAllProducts(String search, Long categoryId, Long supplierId, Boolean lowStock) {
        return productRepository.findAll(search, categoryId, supplierId, lowStock);
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
    }

    public Product getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with SKU: " + sku));
    }

    @Transactional
    public Product createProduct(ProductRequest request) {
        String sku = request.getSku().trim().toUpperCase();
        if (productRepository.findBySku(sku).isPresent()) {
            throw new DuplicateSkuException("A product with SKU '" + sku + "' already exists");
        }

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));
        }

        if (request.getSupplierId() != null) {
            supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + request.getSupplierId()));
        }

        Product product = new Product();
        product.setSku(sku);
        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setCategoryId(request.getCategoryId());
        product.setSupplierId(request.getSupplierId());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setMinimumStockLevel(request.getMinimumStockLevel() != null ? request.getMinimumStockLevel() : 5);
        product.setUnit(request.getUnit() != null ? request.getUnit().trim() : "pcs");

        int initialStock = (request.getInitialStock() != null && request.getInitialStock() > 0) ? request.getInitialStock() : 0;
        product.setCurrentStock(initialStock);

        Product saved = productRepository.save(product);

        // If product was created with initial stock, log an audited STOCK_IN ledger transaction
        if (initialStock > 0) {
            InventoryTransaction trx = new InventoryTransaction();
            trx.setProductId(saved.getId());
            trx.setTransactionType("STOCK_IN");
            trx.setQuantity(initialStock);
            trx.setUnitPrice(saved.getPurchasePrice());
            trx.setPreviousStock(0);
            trx.setNewStock(initialStock);
            trx.setReferenceNotes("Initial opening stock registration");
            transactionRepository.save(trx);
        }

        return getProductById(saved.getId());
    }

    public Product updateProduct(Long id, ProductRequest request) {
        Product existing = getProductById(id);
        String newSku = request.getSku().trim().toUpperCase();

        if (!newSku.equalsIgnoreCase(existing.getSku())) {
            productRepository.findBySku(newSku).ifPresent(p -> {
                throw new DuplicateSkuException("A product with SKU '" + newSku + "' already exists");
            });
            existing.setSku(newSku);
        }

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));
        }
        if (request.getSupplierId() != null) {
            supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + request.getSupplierId()));
        }

        existing.setName(request.getName().trim());
        existing.setDescription(request.getDescription());
        existing.setCategoryId(request.getCategoryId());
        existing.setSupplierId(request.getSupplierId());
        existing.setPurchasePrice(request.getPurchasePrice());
        existing.setSellingPrice(request.getSellingPrice());
        existing.setMinimumStockLevel(request.getMinimumStockLevel());
        existing.setUnit(request.getUnit() != null ? request.getUnit().trim() : "pcs");

        // Notice: current_stock is NEVER modified here! Stock is altered only via InventoryService.
        productRepository.update(existing);
        return getProductById(id);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        if (transactionRepository.hasTransactions(id)) {
            throw new BadRequestException("Cannot delete product because inventory transaction history exists.");
        }
        productRepository.deleteById(product.getId());
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }
}
