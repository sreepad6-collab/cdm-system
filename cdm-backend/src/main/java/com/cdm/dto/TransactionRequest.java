package com.cdm.dto;

import com.cdm.entity.Transaction;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class TransactionRequest {

    @NotBlank(message = "Machine code is required")
    private String machineCode;

    @NotNull(message = "Transaction type is required")
    private Transaction.TransactionType type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least 1")
    private BigDecimal amount;

    private String customerReference;
    private String remarks;

    public String getMachineCode() { return machineCode; }
    public void setMachineCode(String m) { this.machineCode = m; }
    public Transaction.TransactionType getType() { return type; }
    public void setType(Transaction.TransactionType t) { this.type = t; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal a) { this.amount = a; }
    public String getCustomerReference() { return customerReference; }
    public void setCustomerReference(String r) { this.customerReference = r; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String r) { this.remarks = r; }
}
