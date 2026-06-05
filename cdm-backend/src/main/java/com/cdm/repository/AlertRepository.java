package com.cdm.repository;

import com.cdm.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByStatusOrderByCreatedAtDesc(Alert.AlertStatus status);
    List<Alert> findByMachineIdOrderByCreatedAtDesc(Long machineId);
    Optional<Alert> findTopByMachineIdAndStatusOrderByCreatedAtDesc(Long machineId, Alert.AlertStatus status);
    List<Alert> findAllByOrderByCreatedAtDesc();
}
