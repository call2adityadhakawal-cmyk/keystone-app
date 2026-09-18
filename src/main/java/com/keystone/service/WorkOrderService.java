package com.keystone.service;

import com.keystone.domain.*;
import com.keystone.dto.WorkOrderDtos;
import com.keystone.exception.ApiExceptions.ForbiddenException;
import com.keystone.exception.ApiExceptions.IllegalTransitionException;
import com.keystone.exception.ApiExceptions.NotFoundException;
import com.keystone.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * The work-order lifecycle is the core business rule of the platform (brief Section 07).
 * Every transition is checked here - never trust the UI - and every change writes an
 * append-only WorkOrderStatusHistory row.
 */
@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderStatusHistoryRepository historyRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;

    private static final Map<WorkOrderStatus, EnumSet<WorkOrderStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(WorkOrderStatus.class);
    static {
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.NEW, EnumSet.of(WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.ASSIGNED, EnumSet.of(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.IN_PROGRESS, EnumSet.of(WorkOrderStatus.ON_HOLD, WorkOrderStatus.COMPLETED));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.ON_HOLD, EnumSet.of(WorkOrderStatus.IN_PROGRESS));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.COMPLETED, EnumSet.of(WorkOrderStatus.CLOSED, WorkOrderStatus.IN_PROGRESS));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.CLOSED, EnumSet.noneOf(WorkOrderStatus.class));
        ALLOWED_TRANSITIONS.put(WorkOrderStatus.CANCELLED, EnumSet.noneOf(WorkOrderStatus.class));
    }

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                             WorkOrderStatusHistoryRepository historyRepository,
                             CustomerRepository customerRepository,
                             SiteRepository siteRepository,
                             UserRepository userRepository) {
        this.workOrderRepository = workOrderRepository;
        this.historyRepository = historyRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.userRepository = userRepository;
    }

    // ---- reads, scoped by role ----

    @Transactional(readOnly = true)
    public List<WorkOrderDtos.Response> listFor(User caller) {
        List<WorkOrder> orders = switch (caller.getRole()) {
            case CUSTOMER -> workOrderRepository.findByCustomerId(caller.getCustomer().getId());
            case TECHNICIAN -> workOrderRepository.findByAssignedToId(caller.getId());
            case DISPATCHER, MANAGER -> workOrderRepository.findAll();
        };
        return orders.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(WorkOrderDtos.Response::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkOrderDtos.Response getOne(Long id, User caller) {
        WorkOrder wo = find(id);
        assertCanView(wo, caller);
        List<WorkOrderStatusHistory> hist = historyRepository.findByWorkOrderIdOrderByChangedAtAsc(id);
        return WorkOrderDtos.Response.withHistory(wo, hist);
    }

    // ---- writes ----

    @Transactional
    public WorkOrderDtos.Response create(WorkOrderDtos.CreateRequest req, User caller) {
        Customer customer = customerRepository.findById(req.customerId)
                .orElseThrow(() -> new NotFoundException("Customer not found"));
        Site site = siteRepository.findById(req.siteId)
                .orElseThrow(() -> new NotFoundException("Site not found"));
        if (!site.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalTransitionException("Site does not belong to that customer");
        }
        // Customers can only raise requests for their own organisation's sites.
        if (caller.getRole() == Role.CUSTOMER && !caller.getCustomer().getId().equals(customer.getId())) {
            throw new ForbiddenException("You can only raise requests for your own organisation");
        }

        WorkOrder wo = new WorkOrder();
        wo.setCode(nextCode());
        wo.setTitle(req.title);
        wo.setDescription(req.description);
        wo.setPriority(req.priority);
        wo.setStatus(WorkOrderStatus.NEW);
        wo.setCustomer(customer);
        wo.setSite(site);
        wo.setSlaDueAt(slaDueAt(req.priority));
        wo = workOrderRepository.save(wo);

        historyRepository.save(new WorkOrderStatusHistory(wo, null, WorkOrderStatus.NEW, caller.getEmail(), "Raised"));
        return WorkOrderDtos.Response.from(wo);
    }

    @Transactional
    public WorkOrderDtos.Response assign(Long id, Long technicianId, User caller) {
        if (caller.getRole() != Role.DISPATCHER && caller.getRole() != Role.MANAGER) {
            throw new ForbiddenException("Only a dispatcher or manager can assign work orders");
        }
        WorkOrder wo = find(id);
        if (wo.getStatus() == WorkOrderStatus.CLOSED || wo.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new IllegalTransitionException("Cannot assign a " + wo.getStatus() + " work order");
        }
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new NotFoundException("Technician not found"));
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalTransitionException("Assignee must be a technician");
        }

        WorkOrderStatus from = wo.getStatus();
        wo.setAssignedTo(technician);
        if (wo.getStatus() == WorkOrderStatus.NEW) {
            wo.setStatus(WorkOrderStatus.ASSIGNED);
        }
        wo = workOrderRepository.save(wo);

        if (from != wo.getStatus()) {
            historyRepository.save(new WorkOrderStatusHistory(wo, from, wo.getStatus(), caller.getEmail(),
                    "Assigned to " + technician.getName()));
        } else {
            historyRepository.save(new WorkOrderStatusHistory(wo, from, from, caller.getEmail(),
                    "Reassigned to " + technician.getName()));
        }
        return WorkOrderDtos.Response.from(wo);
    }

    @Transactional
    public WorkOrderDtos.Response changeStatus(Long id, WorkOrderStatus toStatus, String note, User caller) {
        WorkOrder wo = find(id);
        WorkOrderStatus from = wo.getStatus();

        if (!ALLOWED_TRANSITIONS.getOrDefault(from, EnumSet.noneOf(WorkOrderStatus.class)).contains(toStatus)) {
            throw new IllegalTransitionException("Cannot move a work order from " + from + " to " + toStatus);
        }
        assertRoleCanTransition(wo, toStatus, caller);

        wo.setStatus(toStatus);
        wo = workOrderRepository.save(wo);
        historyRepository.save(new WorkOrderStatusHistory(wo, from, toStatus, caller.getEmail(), note));
        return WorkOrderDtos.Response.from(wo);
    }

    // ---- helpers ----

    private WorkOrder find(Long id) {
        return workOrderRepository.findById(id).orElseThrow(() -> new NotFoundException("Work order not found"));
    }

    private void assertCanView(WorkOrder wo, User caller) {
        switch (caller.getRole()) {
            case CUSTOMER -> {
                if (!wo.getCustomer().getId().equals(caller.getCustomer().getId())) {
                    throw new ForbiddenException("You can only view your own organisation's work orders");
                }
            }
            case TECHNICIAN -> {
                if (wo.getAssignedTo() == null || !wo.getAssignedTo().getId().equals(caller.getId())) {
                    throw new ForbiddenException("You can only view work orders assigned to you");
                }
            }
            default -> { /* dispatcher/manager see everything */ }
        }
    }

    private void assertRoleCanTransition(WorkOrder wo, WorkOrderStatus toStatus, User caller) {
        boolean isAssignedTechnician = caller.getRole() == Role.TECHNICIAN
                && wo.getAssignedTo() != null
                && wo.getAssignedTo().getId().equals(caller.getId());
        boolean isManagerOrDispatcher = caller.getRole() == Role.MANAGER || caller.getRole() == Role.DISPATCHER;

        switch (toStatus) {
            case IN_PROGRESS, ON_HOLD, COMPLETED -> {
                // the assigned technician runs the job day-to-day; a manager can step in too
                if (!isAssignedTechnician && caller.getRole() != Role.MANAGER) {
                    throw new ForbiddenException("Only the assigned technician (or a manager) can do that");
                }
            }
            case CLOSED -> {
                if (caller.getRole() != Role.MANAGER) {
                    throw new ForbiddenException("Only a manager can close a work order");
                }
            }
            case CANCELLED -> {
                if (!isManagerOrDispatcher) {
                    throw new ForbiddenException("Only a dispatcher or manager can cancel a work order");
                }
            }
            default -> { /* ASSIGNED is handled via the /assign endpoint */ }
        }
    }

    private LocalDateTime slaDueAt(Priority priority) {
        LocalDateTime now = LocalDateTime.now();
        return switch (priority) {
            case URGENT -> now.plusHours(1);
            case HIGH -> now.plusHours(4);
            case MEDIUM -> now.plusHours(24);
            case LOW -> now.plusHours(72);
        };
    }

    private String nextCode() {
        long seq = workOrderRepository.count() + 1;
        return String.format("WO-%d-%06d", LocalDateTime.now().getYear(), seq);
    }
}
