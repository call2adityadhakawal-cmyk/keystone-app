package com.keystone.controller;

import com.keystone.domain.User;
import com.keystone.dto.RefDtos;
import com.keystone.service.AuthService;
import com.keystone.service.ReferenceDataService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ReferenceDataController {

    private final ReferenceDataService referenceDataService;
    private final AuthService authService;

    public ReferenceDataController(ReferenceDataService referenceDataService, AuthService authService) {
        this.referenceDataService = referenceDataService;
        this.authService = authService;
    }

    @GetMapping("/customers")
    public List<RefDtos.CustomerResponse> customers(Authentication auth) {
        User caller = authService.currentUser(auth.getName());
        return referenceDataService.customersFor(caller);
    }

    @GetMapping("/customers/{id}/sites")
    public List<RefDtos.SiteResponse> sites(@PathVariable Long id) {
        return referenceDataService.sitesFor(id);
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('DISPATCHER','MANAGER')")
    public List<RefDtos.UserResponse> technicians() {
        return referenceDataService.technicians();
    }
}
