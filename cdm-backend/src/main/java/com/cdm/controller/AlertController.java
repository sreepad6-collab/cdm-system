package com.cdm.controller;

import com.cdm.dto.ApiResponse;
import com.cdm.dto.RefillRequestDto;
import com.cdm.entity.Alert;
import com.cdm.entity.Machine;
import com.cdm.entity.RefillRequest;
import com.cdm.service.AlertService;
import com.cdm.service.MachineService;
import com.cdm.service.RefillService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AlertController {

    private final AlertService alertService;
    private final RefillService refillService;
    private final MachineService machineService;

    public AlertController(AlertService alertService,
                           RefillService refillService,
                           MachineService machineService) {
        this.alertService = alertService;
        this.refillService = refillService;
        this.machineService = machineService;
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<Alert>>> getAllAlerts() {
        return ResponseEntity.ok(ApiResponse.ok("Alerts fetched", alertService.getAllAlerts()));
    }

    @GetMapping("/alerts/pending")
    public ResponseEntity<ApiResponse<List<Alert>>> getPendingAlerts() {
        return ResponseEntity.ok(ApiResponse.ok("Pending alerts", alertService.getPendingAlerts()));
    }

    @PatchMapping("/alerts/{id}/acknowledge")
    public ResponseEntity<ApiResponse<Alert>> acknowledgeAlert(
            @PathVariable Long id, @RequestParam String handledBy) {
        return ResponseEntity.ok(ApiResponse.ok("Alert acknowledged",
                alertService.acknowledgeAlert(id, handledBy)));
    }

    @PatchMapping("/alerts/{id}/resolve")
    public ResponseEntity<ApiResponse<Alert>> resolveAlert(
            @PathVariable Long id, @RequestParam String handledBy) {
        return ResponseEntity.ok(ApiResponse.ok("Alert resolved",
                alertService.resolveAlert(id, handledBy)));
    }

    @GetMapping("/refill-requests")
    public ResponseEntity<ApiResponse<List<RefillRequest>>> getOpenRequests() {
        return ResponseEntity.ok(ApiResponse.ok("Open refill requests", refillService.getAllRequests()));
    }

    @GetMapping("/refill-requests/machine/{machineId}")
    public ResponseEntity<ApiResponse<List<RefillRequest>>> getRequestsForMachine(@PathVariable Long machineId) {
        return ResponseEntity.ok(ApiResponse.ok("Refill requests fetched",
                refillService.getRequestsForMachine(machineId)));
    }

    @PostMapping("/refill-requests/customer")
    public ResponseEntity<ApiResponse<RefillRequest>> customerRefillRequest(
            @Valid @RequestBody RefillRequestDto dto) {
        try {
            RefillRequest req = refillService.raiseCustomerRefillRequest(dto);
            return ResponseEntity.ok(ApiResponse.ok(
                    "Your request has been sent to management. We will refill the machine shortly.", req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/refill-requests/{id}/status")
    public ResponseEntity<ApiResponse<RefillRequest>> updateRefillStatus(
            @PathVariable Long id,
            @RequestParam RefillRequest.RequestStatus status,
            @RequestParam String handledBy) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated",
                refillService.updateStatus(id, status, handledBy)));
    }

    @PostMapping("/machines/{machineId}/complete-refill")
    public ResponseEntity<ApiResponse<Machine>> completeRefill(
            @PathVariable Long machineId,
            @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String handledBy = body.getOrDefault("handledBy", "Manager").toString();
        Machine machine = refillService.completeCashLoad(machineId, amount, handledBy);
        return ResponseEntity.ok(ApiResponse.ok("Machine refilled successfully", machine));
    }
}
