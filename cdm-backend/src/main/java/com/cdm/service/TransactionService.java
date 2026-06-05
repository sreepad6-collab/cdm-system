package com.cdm.service;

import com.cdm.dto.TransactionRequest;
import com.cdm.entity.Machine;
import com.cdm.entity.Transaction;
import com.cdm.repository.MachineRepository;
import com.cdm.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final MachineRepository machineRepository;
    private final AlertService alertService;
    private final RefillService refillService;

    public TransactionService(TransactionRepository transactionRepository,
                               MachineRepository machineRepository,
                               AlertService alertService,
                               RefillService refillService) {
        this.transactionRepository = transactionRepository;
        this.machineRepository = machineRepository;
        this.alertService = alertService;
        this.refillService = refillService;
    }

    @Transactional
    public Transaction processTransaction(TransactionRequest request) {
        Machine machine = machineRepository.findByMachineCode(request.getMachineCode())
                .orElseThrow(() -> new RuntimeException("Machine not found: " + request.getMachineCode()));

        if (machine.getStatus() == Machine.MachineStatus.MAINTENANCE) {
            throw new RuntimeException("Machine is currently under maintenance.");
        }

        BigDecimal balanceBefore = machine.getCurrentBalance();
        BigDecimal amount = request.getAmount();

        if (request.getType() == Transaction.TransactionType.WITHDRAWAL) {
            if (machine.getStatus() == Machine.MachineStatus.EMPTY) {
                throw new RuntimeException("Machine has no cash available. Refill in progress.");
            }
            if (balanceBefore.compareTo(amount) < 0) {
                throw new RuntimeException(String.format(
                        "Insufficient cash. Available: ₹%.0f, Requested: ₹%.0f", balanceBefore, amount));
            }
        }

        BigDecimal balanceAfter = request.getType() == Transaction.TransactionType.WITHDRAWAL
                ? balanceBefore.subtract(amount)
                : balanceBefore.add(amount);

        if (request.getType() == Transaction.TransactionType.DEPOSIT
                && balanceAfter.compareTo(machine.getTotalCapacity()) > 0) {
            throw new RuntimeException(String.format(
                    "Deposit exceeds machine capacity. Available space: ₹%.0f",
                    machine.getTotalCapacity().subtract(balanceBefore)));
        }

        machine.setCurrentBalance(balanceAfter);
        machine.setLastTransactionAt(LocalDateTime.now());
        updateMachineStatus(machine);
        machineRepository.save(machine);

        Transaction txn = new Transaction();
        txn.setMachine(machine);
        txn.setType(request.getType());
        txn.setAmount(amount);
        txn.setBalanceBefore(balanceBefore);
        txn.setBalanceAfter(balanceAfter);
        txn.setCustomerReference(request.getCustomerReference());
        txn.setRemarks(request.getRemarks());

        Transaction saved = transactionRepository.save(txn);

        if (request.getType() == Transaction.TransactionType.WITHDRAWAL) {
            alertService.evaluateAndAlert(machine);
            if (machine.getStatus() == Machine.MachineStatus.EMPTY
                    || machine.getStatus() == Machine.MachineStatus.LOW_CASH) {
                refillService.raiseSystemRefillRequest(machine);
            }
        }

        return saved;
    }

    private void updateMachineStatus(Machine machine) {
        BigDecimal balance = machine.getCurrentBalance();
        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            machine.setCurrentBalance(BigDecimal.ZERO);
            machine.setStatus(Machine.MachineStatus.EMPTY);
        } else if (balance.compareTo(machine.getLowThreshold()) <= 0) {
            machine.setStatus(Machine.MachineStatus.LOW_CASH);
        } else {
            machine.setStatus(Machine.MachineStatus.ACTIVE);
        }
    }

    public List<Transaction> getTransactionsForMachine(Long machineId) {
        return transactionRepository.findByMachineIdOrderByTimestampDesc(machineId);
    }

    public List<Transaction> getRecentTransactionsForMachine(Long machineId) {
        return transactionRepository.findTop10ByMachineIdOrderByTimestampDesc(machineId);
    }
}
