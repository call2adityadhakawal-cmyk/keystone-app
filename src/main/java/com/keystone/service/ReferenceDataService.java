package com.keystone.service;

import com.keystone.domain.Role;
import com.keystone.domain.User;
import com.keystone.dto.RefDtos;
import com.keystone.repository.CustomerRepository;
import com.keystone.repository.SiteRepository;
import com.keystone.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReferenceDataService {

    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;

    public ReferenceDataService(CustomerRepository customerRepository, SiteRepository siteRepository,
                                 UserRepository userRepository) {
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.userRepository = userRepository;
    }

    public List<RefDtos.CustomerResponse> customersFor(User caller) {
        if (caller.getRole() == Role.CUSTOMER) {
            return List.of(RefDtos.CustomerResponse.from(caller.getCustomer()));
        }
        return customerRepository.findAll().stream().map(RefDtos.CustomerResponse::from).collect(Collectors.toList());
    }

    public List<RefDtos.SiteResponse> sitesFor(Long customerId) {
        return siteRepository.findByCustomerId(customerId).stream()
                .map(RefDtos.SiteResponse::from)
                .collect(Collectors.toList());
    }

    public List<RefDtos.UserResponse> technicians() {
        return userRepository.findByRole(Role.TECHNICIAN).stream()
                .map(RefDtos.UserResponse::from)
                .collect(Collectors.toList());
    }
}
