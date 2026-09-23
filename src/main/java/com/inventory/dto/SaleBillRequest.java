package com.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class SaleBillRequest {
    private String customerName;
    private String referenceNotes;

    @NotEmpty(message = "Sale bill must contain at least one item")
    @Valid
    private List<StockOutRequest> items;

    public SaleBillRequest() {}

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getReferenceNotes() { return referenceNotes; }
    public void setReferenceNotes(String referenceNotes) { this.referenceNotes = referenceNotes; }

    public List<StockOutRequest> getItems() { return items; }
    public void setItems(List<StockOutRequest> items) { this.items = items; }
}