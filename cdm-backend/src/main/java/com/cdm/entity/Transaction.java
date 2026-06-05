package com.cdm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private BigDecimal balanceBefore;

    @Column(nullable = false)
    private BigDecimal balanceAfter;

    private String customerReference;
    private String remarks;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() { timestamp = LocalDateTime.now(); }

    public enum TransactionType { DEPOSIT, WITHDRAWAL, REFILL }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Machine getMachine() { return machine; }
    public void setMachine(Machine m) { this.machine = m; }
    public TransactionType getType() { return type; }
    public void setType(TransactionType t) { this.type = t; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal a) { this.amount = a; }
    public BigDecimal getBalanceBefore() { return balanceBefore; }
    public void setBalanceBefore(BigDecimal b) { this.balanceBefore = b; }
    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(BigDecimal b) { this.balanceAfter = b; }
    public String getCustomerReference() { return customerReference; }
    public void setCustomerReference(String r) { this.customerReference = r; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String r) { this.remarks = r; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime t) { this.timestamp = t; }
}
