package com.cdm.service;

import com.cdm.entity.Alert;
import com.cdm.entity.Machine;
import com.cdm.repository.AlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AlertService(AlertRepository alertRepository, SimpMessagingTemplate messagingTemplate) {
        this.alertRepository = alertRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void evaluateAndAlert(Machine machine) {
        BigDecimal balance = machine.getCurrentBalance();
        BigDecimal threshold = machine.getLowThreshold();

        Alert.AlertType alertType = null;
        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            alertType = Alert.AlertType.EMPTY;
        } else if (balance.compareTo(threshold) <= 0) {
            alertType = Alert.AlertType.LOW_CASH;
        }

        if (alertType == null) return;

        boolean alreadyOpen = alertRepository
                .findTopByMachineIdAndStatusOrderByCreatedAtDesc(machine.getId(), Alert.AlertStatus.PENDING)
                .isPresent();
        if (alreadyOpen) return;

        String msg = buildMessage(machine, alertType, balance);

        Alert alert = new Alert();
        alert.setMachine(machine);
        alert.setAlertType(alertType);
        alert.setStatus(Alert.AlertStatus.PENDING);
        alert.setMessage(msg);

        Alert saved = alertRepository.save(alert);
        log.info("Alert raised: {} for machine {}", alertType, machine.getMachineCode());
        pushToManagement(saved);
    }

    private String buildMessage(Machine machine, Alert.AlertType type, BigDecimal balance) {
        String location = machine.getLocation();
        String code = machine.getMachineCode();
        if (type == Alert.AlertType.EMPTY) {
            return String.format("URGENT: CDM %s at %s is EMPTY. Immediate cash refill required.", code, location);
        }
        return String.format("LOW CASH: CDM %s at %s has ₹%.0f remaining (below threshold ₹%.0f). Please initiate refill.",
                code, location, balance, machine.getLowThreshold());
    }

    private void pushToManagement(Alert alert) {
        Map<String, Object> payload = Map.of(
                "alertId", alert.getId(),
                "machineCode", alert.getMachine().getMachineCode(),
                "location", alert.getMachine().getLocation(),
                "alertType", alert.getAlertType().name(),
                "message", alert.getMessage(),
                "createdAt", alert.getCreatedAt().toString()
        );
        messagingTemplate.convertAndSend("/topic/alerts", payload);
        log.info("WebSocket alert pushed for machine {}", alert.getMachine().getMachineCode());
    }

    @Transactional
    public Alert acknowledgeAlert(Long alertId, String handledBy) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        alert.setStatus(Alert.AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(LocalDateTime.now());
        alert.setAcknowledgedBy(handledBy);
        return alertRepository.save(alert);
    }

    @Transactional
    public Alert resolveAlert(Long alertId, String handledBy) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        alert.setStatus(Alert.AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        alert.setResolvedBy(handledBy);
        return alertRepository.save(alert);
    }

    public List<Alert> getAllAlerts() { return alertRepository.findAllByOrderByCreatedAtDesc(); }
    public List<Alert> getPendingAlerts() { return alertRepository.findByStatusOrderByCreatedAtDesc(Alert.AlertStatus.PENDING); }
    public List<Alert> getAlertsByMachine(Long machineId) { return alertRepository.findByMachineIdOrderByCreatedAtDesc(machineId); }
}
