package com.keystone.controller;

import com.keystone.domain.User;
import com.keystone.dto.WorkOrderDtos;
import com.keystone.service.AuthService;
import com.keystone.service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work-orders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final AuthService authService;

    public WorkOrderController(WorkOrderService workOrderService, AuthService authService) {
        this.workOrderService = workOrderService;
        this.authService = authService;
    }

    private User caller(Authentication auth) {
        return authService.currentUser(auth.getName());
    }

    @GetMapping
    public List<WorkOrderDtos.Response> list(Authentication auth) {
        return workOrderService.listFor(caller(auth));
    }

    @GetMapping("/{id}")
    public WorkOrderDtos.Response getOne(@PathVariable Long id, Authentication auth) {
        return workOrderService.getOne(id, caller(auth));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER','CUSTOMER')")
    public WorkOrderDtos.Response create(@Valid @RequestBody WorkOrderDtos.CreateRequest req, Authentication auth) {
        return workOrderService.create(req, caller(auth));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public WorkOrderDtos.Response assign(@PathVariable Long id, @Valid @RequestBody WorkOrderDtos.AssignRequest req,
                                          Authentication auth) {
        return workOrderService.assign(id, req.technicianId, caller(auth));
    }

    @PostMapping("/{id}/status")
    public WorkOrderDtos.Response changeStatus(@PathVariable Long id,
                                                @Valid @RequestBody WorkOrderDtos.StatusChangeRequest req,
                                                Authentication auth) {
        return workOrderService.changeStatus(id, req.toStatus, req.note, caller(auth));
    }
}
