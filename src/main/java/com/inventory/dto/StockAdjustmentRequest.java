package com.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class StockAdjustmentRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "New physical count is required")
    @PositiveOrZero(message = "Physical count cannot be negative")
    private Integer newPhysicalCount;

    @NotBlank(message = "Adjustment reason notes are required")
    private String reason;

    public StockAdjustmentRequest() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Integer getNewPhysicalCount() { return newPhysicalCount; }
    public void setNewPhysicalCount(Integer newPhysicalCount) { this.newPhysicalCount = newPhysicalCount; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
