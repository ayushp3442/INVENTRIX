package com.inventory.controller;

import com.inventory.dto.*;
import com.inventory.model.InventoryTransaction;
import com.inventory.model.Product;
import com.inventory.service.InventoryService;
import com.inventory.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;
    private final ProductService productService;

    public InventoryController(InventoryService inventoryService, ProductService productService) {
        this.inventoryService = inventoryService;
        this.productService = productService;
    }

    @PostMapping("/stock-in")
    public ResponseEntity<ApiResponse<InventoryTransaction>> recordStockIn(@Valid @RequestBody StockInRequest request) {
        InventoryTransaction transaction = inventoryService.recordStockIn(request);
        return new ResponseEntity<>(ApiResponse.success("Stock In recorded successfully", transaction), HttpStatus.CREATED);
    }

    @PostMapping("/stock-out")
    public ResponseEntity<ApiResponse<InventoryTransaction>> recordStockOut(@Valid @RequestBody StockOutRequest request) {
        InventoryTransaction transaction = inventoryService.recordStockOut(request);
        return new ResponseEntity<>(ApiResponse.success("Stock Out recorded successfully", transaction), HttpStatus.CREATED);
    }

    @PostMapping("/sale")
    public ResponseEntity<ApiResponse<List<InventoryTransaction>>> recordSale(@Valid @RequestBody SaleBillRequest request) {
        List<InventoryTransaction> transactions = inventoryService.recordSaleBill(request);
        return new ResponseEntity<>(ApiResponse.success("Sale bill completed successfully", transactions), HttpStatus.CREATED);
    }

    @PostMapping("/adjustment")
    public ResponseEntity<ApiResponse<InventoryTransaction>> recordAdjustment(@Valid @RequestBody StockAdjustmentRequest request) {
        InventoryTransaction transaction = inventoryService.recordAdjustment(request);
        return new ResponseEntity<>(ApiResponse.success("Stock Adjustment reconciled successfully", transaction), HttpStatus.CREATED);
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<InventoryTransaction>>> getTransactions(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "100") Integer limit) {
        List<InventoryTransaction> transactions = inventoryService.getTransactions(productId, type, limit);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @GetMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<InventoryTransaction>> getTransactionById(@PathVariable Long id) {
        InventoryTransaction transaction = inventoryService.getTransactionById(id);
        return ResponseEntity.ok(ApiResponse.success(transaction));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<InventoryStatsResponse>> getStatistics() {
        InventoryStatsResponse stats = inventoryService.getStatistics();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<Product>>> getLowStock() {
        List<Product> lowStock = productService.getLowStockProducts();
        return ResponseEntity.ok(ApiResponse.success(lowStock));
    }

    @GetMapping("/category-breakdown")
    public ResponseEntity<ApiResponse<List<CategoryBreakdownDto>>> getCategoryBreakdown() {
        List<CategoryBreakdownDto> breakdown = inventoryService.getCategoryBreakdown();
        return ResponseEntity.ok(ApiResponse.success(breakdown));
    }
}
