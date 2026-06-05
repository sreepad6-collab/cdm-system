package com.cdm.repository;

import com.cdm.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByMachineIdOrderByTimestampDesc(Long machineId);
    List<Transaction> findTop10ByMachineIdOrderByTimestampDesc(Long machineId);
}
