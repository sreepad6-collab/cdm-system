package com.cdm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "machine_id", nullable = false)
    private Machine machine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertType alertType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime acknowledgedAt;
    private String acknowledgedBy;
    private LocalDateTime resolvedAt;
    private String resolvedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = AlertStatus.PENDING;
    }

    public enum AlertType { LOW_CASH, EMPTY }
    public enum AlertStatus { PENDING, ACKNOWLEDGED, RESOLVED }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Machine getMachine() { return machine; }
    public void setMachine(Machine m) { this.machine = m; }
    public AlertType getAlertType() { return alertType; }
    public void setAlertType(AlertType t) { this.alertType = t; }
    public AlertStatus getStatus() { return status; }
    public void setStatus(AlertStatus s) { this.status = s; }
    public String getMessage() { return message; }
    public void setMessage(String m) { this.message = m; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime t) { this.createdAt = t; }
    public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(LocalDateTime t) { this.acknowledgedAt = t; }
    public String getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(String s) { this.acknowledgedBy = s; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime t) { this.resolvedAt = t; }
    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String s) { this.resolvedBy = s; }
}
