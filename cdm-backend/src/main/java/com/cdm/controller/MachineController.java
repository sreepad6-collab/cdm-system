package com.cdm.controller;

import com.cdm.dto.ApiResponse;
import com.cdm.entity.Machine;
import com.cdm.service.MachineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/machines")
public class MachineController {

    private final MachineService machineService;

    public MachineController(MachineService machineService) {
        this.machineService = machineService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Machine>>> getAllMachines() {
        return ResponseEntity.ok(ApiResponse.ok("Machines fetched", machineService.getAllMachines()));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<Machine>> getMachine(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.ok("Machine fetched", machineService.getMachineByCode(code)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Machine>> registerMachine(@RequestBody Machine machine) {
        return ResponseEntity.ok(ApiResponse.ok("Machine registered", machineService.registerMachine(machine)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Machine>> updateStatus(
            @PathVariable Long id,
            @RequestParam Machine.MachineStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated", machineService.updateStatus(id, status)));
    }
}
