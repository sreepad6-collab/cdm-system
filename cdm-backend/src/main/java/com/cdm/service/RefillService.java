package com.cdm.service;

import com.cdm.dto.RefillRequestDto;
import com.cdm.entity.Machine;
import com.cdm.entity.RefillRequest;
import com.cdm.repository.MachineRepository;
import com.cdm.repository.RefillRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class RefillService {

    private static final Logger log = LoggerFactory.getLogger(RefillService.class);

    private final RefillRequestRepository refillRequestRepository;
    private final MachineRepository machineRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public RefillService(RefillRequestRepository refillRequestRepository,
                         MachineRepository machineRepository,
                         SimpMessagingTemplate messagingTemplate) {
        this.refillRequestRepository = refillRequestRepository;
        this.machineRepository = machineRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public void raiseSystemRefillRequest(Machine machine) {
        boolean alreadyOpen = refillRequestRepository
                .existsByMachineIdAndStatus(machine.getId(), RefillRequest.RequestStatus.OPEN);
        if (alreadyOpen) return;

        BigDecimal needed = machine.getTotalCapacity().subtract(machine.getCurrentBalance());

        RefillRequest req = new RefillRequest();
        req.setMachine(machine);
        req.setRequestedBy(RefillRequest.RequestedBy.SYSTEM);
        req.setStatus(RefillRequest.RequestStatus.OPEN);
        req.setRequestedAmount(needed);
        req.setRemarks("Auto-raised: machine balance depleted after customer withdrawal.");

        RefillRequest saved = refillRequestRepository.save(req);
        log.info("System refill request raised for machine {}", machine.getMachineCode());
        notifyManagement(saved, machine);
    }

    @Transactional
    public RefillRequest raiseCustomerRefillRequest(RefillRequestDto dto) {
        Machine machine = machineRepository.findByMachineCode(dto.getMachineCode())
                .orElseThrow(() -> new RuntimeException("Machine not found: " + dto.getMachineCode()));

        RefillRequest req = new RefillRequest();
        req.setMachine(machine);
        req.setRequestedBy(RefillRequest.RequestedBy.CUSTOMER);
        req.setCustomerName(dto.getCustomerName());
        req.setCustomerContact(dto.getCustomerContact());
        req.setCustomerAccountRef(dto.getCustomerAccountRef());
        req.setStatus(RefillRequest.RequestStatus.OPEN);
        req.setRequestedAmount(dto.getRequestedAmount());
        req.setRemarks(dto.getRemarks());

        RefillRequest saved = refillRequestRepository.save(req);
        log.info("Customer refill request from {} for machine {}", dto.getCustomerContact(), machine.getMachineCode());
        notifyManagement(saved, machine);
        return saved;
    }

    @Transactional
    public RefillRequest updateStatus(Long requestId, RefillRequest.RequestStatus newStatus, String handledBy) {
        RefillRequest req = refillRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Refill request not found: " + requestId));
        req.setStatus(newStatus);
        req.setHandledBy(handledBy);

        if (newStatus == RefillRequest.RequestStatus.IN_PROGRESS) {
            req.getMachine().setStatus(Machine.MachineStatus.REFILLING);
            machineRepository.save(req.getMachine());
        }

        messagingTemplate.convertAndSend("/topic/refill-status", Map.of(
                "requestId", req.getId(),
                "machineCode", req.getMachine().getMachineCode(),
                "location", req.getMachine().getLocation(),
                "status", newStatus.name(),
                "handledBy", handledBy != null ? handledBy : "System"
        ));

        return refillRequestRepository.save(req);
    }

    @Transactional
    public Machine completeCashLoad(Long machineId, BigDecimal loadedAmount, String handledBy) {
        Machine machine = machineRepository.findById(machineId)
                .orElseThrow(() -> new RuntimeException("Machine not found: " + machineId));

        machine.setCurrentBalance(machine.getCurrentBalance().add(loadedAmount));
        if (machine.getCurrentBalance().compareTo(machine.getTotalCapacity()) > 0) {
            machine.setCurrentBalance(machine.getTotalCapacity());
        }
        machine.setStatus(Machine.MachineStatus.ACTIVE);
        Machine saved = machineRepository.save(machine);

        List<RefillRequest> openRequests = refillRequestRepository
                .findByMachineIdOrderByCreatedAtDesc(machineId)
                .stream()
                .filter(r -> r.getStatus() == RefillRequest.RequestStatus.OPEN
                        || r.getStatus() == RefillRequest.RequestStatus.IN_PROGRESS)
                .toList();

        for (RefillRequest r : openRequests) {
            r.setStatus(RefillRequest.RequestStatus.COMPLETED);
            r.setHandledBy(handledBy);
            refillRequestRepository.save(r);
        }

        messagingTemplate.convertAndSend("/topic/refill-status", Map.of(
                "machineCode", machine.getMachineCode(),
                "location", machine.getLocation(),
                "status", "COMPLETED",
                "newBalance", machine.getCurrentBalance(),
                "message", "Machine has been refilled and is now active."
        ));

        log.info("Machine {} refilled with {} by {}", machine.getMachineCode(), loadedAmount, handledBy);
        return saved;
    }

    public List<RefillRequest> getAllRequests() {
        return refillRequestRepository.findByStatusOrderByCreatedAtDesc(RefillRequest.RequestStatus.OPEN);
    }

    public List<RefillRequest> getRequestsForMachine(Long machineId) {
        return refillRequestRepository.findByMachineIdOrderByCreatedAtDesc(machineId);
    }

    private void notifyManagement(RefillRequest req, Machine machine) {
        messagingTemplate.convertAndSend("/topic/refill-requests", Map.of(
                "requestId", req.getId(),
                "machineCode", machine.getMachineCode(),
                "location", machine.getLocation(),
                "requestedBy", req.getRequestedBy().name(),
                "currentBalance", machine.getCurrentBalance(),
                "status", req.getStatus().name()
        ));
    }
}
