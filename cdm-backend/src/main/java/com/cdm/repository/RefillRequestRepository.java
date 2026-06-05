package com.cdm.repository;

import com.cdm.entity.RefillRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefillRequestRepository extends JpaRepository<RefillRequest, Long> {
    List<RefillRequest> findByMachineIdOrderByCreatedAtDesc(Long machineId);
    List<RefillRequest> findByStatusOrderByCreatedAtDesc(RefillRequest.RequestStatus status);
    boolean existsByMachineIdAndStatus(Long machineId, RefillRequest.RequestStatus status);
}
