package com.cdm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refill_request")
public class RefillRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestedBy requestedBy;

    private String customerName;
    private String customerContact;
    private String customerAccountRef;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    private BigDecimal requestedAmount;
    private String remarks;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
    private String handledBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = RequestStatus.OPEN;
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum RequestedBy { SYSTEM, CUSTOMER }
    public enum RequestStatus { OPEN, IN_PROGRESS, COMPLETED, CANCELLED }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Machine getMachine() { return machine; }
    public void setMachine(Machine m) { this.machine = m; }
    public RequestedBy getRequestedBy() { return requestedBy; }
    public void setRequestedBy(RequestedBy r) { this.requestedBy = r; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String n) { this.customerName = n; }
    public String getCustomerContact() { return customerContact; }
    public void setCustomerContact(String c) { this.customerContact = c; }
    public String getCustomerAccountRef() { return customerAccountRef; }
    public void setCustomerAccountRef(String r) { this.customerAccountRef = r; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus s) { this.status = s; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
    public void setRequestedAmount(BigDecimal a) { this.requestedAmount = a; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String r) { this.remarks = r; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime t) { this.updatedAt = t; }
    public String getHandledBy() { return handledBy; }
    public void setHandledBy(String h) { this.handledBy = h; }
}
