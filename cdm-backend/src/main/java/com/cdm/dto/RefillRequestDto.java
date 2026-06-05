package com.cdm.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class RefillRequestDto {

    @NotBlank(message = "Machine code is required")
    private String machineCode;

    private String customerName;

    @NotBlank(message = "Customer contact is required")
    private String customerContact;

    private String customerAccountRef;
    private BigDecimal requestedAmount;
    private String remarks;

    public String getMachineCode() { return machineCode; }
    public void setMachineCode(String m) { this.machineCode = m; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String n) { this.customerName = n; }
    public String getCustomerContact() { return customerContact; }
    public void setCustomerContact(String c) { this.customerContact = c; }
    public String getCustomerAccountRef() { return customerAccountRef; }
    public void setCustomerAccountRef(String r) { this.customerAccountRef = r; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal a) { this.requestedAmount = a; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String r) { this.remarks = r; }
}
