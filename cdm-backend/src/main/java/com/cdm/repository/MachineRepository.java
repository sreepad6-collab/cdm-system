package com.cdm.repository;

import com.cdm.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MachineRepository extends JpaRepository<Machine, Long> {
    Optional<Machine> findByMachineCode(String machineCode);
    List<Machine> findByStatus(Machine.MachineStatus status);
    boolean existsByMachineCode(String machineCode);
}
