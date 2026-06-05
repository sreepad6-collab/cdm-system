package com.cdm.controller;

import com.cdm.dto.ApiResponse;
import com.cdm.dto.TransactionRequest;
import com.cdm.entity.Transaction;
import com.cdm.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Transaction>> processTransaction(
            @Valid @RequestBody TransactionRequest request) {
        try {
            Transaction txn = transactionService.processTransaction(request);
            return ResponseEntity.ok(ApiResponse.ok("Transaction processed successfully", txn));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/machine/{machineId}")
    public ResponseEntity<ApiResponse<List<Transaction>>> getTransactions(@PathVariable Long machineId) {
        return ResponseEntity.ok(ApiResponse.ok("Transactions fetched",
                transactionService.getTransactionsForMachine(machineId)));
    }

    @GetMapping("/machine/{machineId}/recent")
    public ResponseEntity<ApiResponse<List<Transaction>>> getRecentTransactions(@PathVariable Long machineId) {
        return ResponseEntity.ok(ApiResponse.ok("Recent transactions fetched",
                transactionService.getRecentTransactionsForMachine(machineId)));
    }
}
