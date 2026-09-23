package com.inventory.dto;

public class CategoryBreakdownDto {
    private Long categoryId;
    private String categoryName;
    private Long totalStock;

    public CategoryBreakdownDto() {}

    public CategoryBreakdownDto(Long categoryId, String categoryName, Long totalStock) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.totalStock = totalStock;
    }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Long getTotalStock() { return totalStock; }
    public void setTotalStock(Long totalStock) { this.totalStock = totalStock; }
}
