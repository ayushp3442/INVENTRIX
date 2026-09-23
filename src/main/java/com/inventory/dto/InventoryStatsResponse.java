package com.inventory.dto;

import java.math.BigDecimal;

public class InventoryStatsResponse {
    private long totalProducts;
    private long totalCategories;
    private long totalSuppliers;
    private long totalStockUnits;
    private long lowStockProducts;
    private long outOfStockProducts;
    private BigDecimal totalInventoryValuation;

    public InventoryStatsResponse() {
        this.totalInventoryValuation = BigDecimal.ZERO;
    }

    public long getTotalProducts() { return totalProducts; }
    public void setTotalProducts(long totalProducts) { this.totalProducts = totalProducts; }

    public long getTotalCategories() { return totalCategories; }
    public void setTotalCategories(long totalCategories) { this.totalCategories = totalCategories; }

    public long getTotalSuppliers() { return totalSuppliers; }
    public void setTotalSuppliers(long totalSuppliers) { this.totalSuppliers = totalSuppliers; }

    public long getTotalStockUnits() { return totalStockUnits; }
    public void setTotalStockUnits(long totalStockUnits) { this.totalStockUnits = totalStockUnits; }

    public long getLowStockProducts() { return lowStockProducts; }
    public void setLowStockProducts(long lowStockProducts) { this.lowStockProducts = lowStockProducts; }

    public long getOutOfStockProducts() { return outOfStockProducts; }
    public void setOutOfStockProducts(long outOfStockProducts) { this.outOfStockProducts = outOfStockProducts; }

    public BigDecimal getTotalInventoryValuation() { return totalInventoryValuation; }
    public void setTotalInventoryValuation(BigDecimal totalInventoryValuation) { this.totalInventoryValuation = totalInventoryValuation; }
}
