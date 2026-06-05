package com.cdm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "machine")
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String machineCode;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private BigDecimal currentBalance;

    @Column(nullable = false)
    private BigDecimal totalCapacity;

    @Column(nullable = false)
    private BigDecimal lowThreshold;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MachineStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime lastTransactionAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = MachineStatus.ACTIVE;
    }

    public enum MachineStatus {
        ACTIVE, LOW_CASH, EMPTY, REFILLING, MAINTENANCE
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMachineCode() { return machineCode; }
    public void setMachineCode(String c) { this.machineCode = c; }
    public String getLocation() { return location; }
    public void setLocation(String l) { this.location = l; }
    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal b) { this.currentBalance = b; }
    public BigDecimal getTotalCapacity() { return totalCapacity; }
    public void setTotalCapacity(BigDecimal c) { this.totalCapacity = c; }
    public BigDecimal getLowThreshold() { return lowThreshold; }
    public void setLowThreshold(BigDecimal t) { this.lowThreshold = t; }
    public MachineStatus getStatus() { return status; }
    public void setStatus(MachineStatus s) { this.status = s; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
    public LocalDateTime getLastTransactionAt() { return lastTransactionAt; }
    public void setLastTransactionAt(LocalDateTime t) { this.lastTransactionAt = t; }
}
