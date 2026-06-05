package com.cdm.service;

import com.cdm.entity.Machine;
import com.cdm.repository.MachineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MachineService {

    private final MachineRepository machineRepository;

    public MachineService(MachineRepository machineRepository) {
        this.machineRepository = machineRepository;
    }

    public List<Machine> getAllMachines() { return machineRepository.findAll(); }

    public Machine getMachineByCode(String code) {
        return machineRepository.findByMachineCode(code)
                .orElseThrow(() -> new RuntimeException("Machine not found: " + code));
    }

    public Machine getMachineById(Long id) {
        return machineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Machine not found: " + id));
    }

    @Transactional
    public Machine registerMachine(Machine machine) {
        if (machineRepository.existsByMachineCode(machine.getMachineCode())) {
            throw new RuntimeException("Machine code already exists: " + machine.getMachineCode());
        }
        return machineRepository.save(machine);
    }

    @Transactional
    public Machine updateStatus(Long id, Machine.MachineStatus status) {
        Machine machine = getMachineById(id);
        machine.setStatus(status);
        return machineRepository.save(machine);
    }
}
