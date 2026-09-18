package com.keystone.service;

import com.keystone.domain.Customer;
import com.keystone.domain.Role;
import com.keystone.domain.User;
import com.keystone.dto.AuthDtos;
import com.keystone.exception.ApiExceptions.BadCredentialsException;
import com.keystone.exception.ApiExceptions.BadRequestException;
import com.keystone.exception.ApiExceptions.ConflictException;
import com.keystone.repository.CustomerRepository;
import com.keystone.repository.UserRepository;
import com.keystone.security.JwtUtil;
import org.hibernate.Hibernate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;

@Service
public class AuthService {

    /** Roles a stranger is allowed to request for themselves. The rest are created by an admin. */
    private static final Set<Role> SELF_SERVICE_ROLES = EnumSet.of(Role.CUSTOMER, Role.TECHNICIAN);

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, CustomerRepository customerRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Creates a CUSTOMER or TECHNICIAN account and signs the new user straight in.
     * A customer sign-up is attached to an existing organisation when the company name
     * matches one we already know, otherwise a new organisation record is created.
     */
    @Transactional
    public AuthDtos.LoginResponse register(AuthDtos.RegisterRequest req) {
        String email = req.email == null ? "" : req.email.trim().toLowerCase();
        String name = req.name == null ? "" : req.name.trim();

        Role role;
        try {
            role = Role.valueOf(req.role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unknown account type.");
        }
        if (!SELF_SERVICE_ROLES.contains(role)) {
            throw new BadRequestException(
                    "Dispatcher and manager accounts are created by an administrator, not through sign-up.");
        }

        if (!isStrongEnough(req.password)) {
            throw new BadRequestException("Password must be at least 8 characters and include a letter and a number.");
        }
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ConflictException("An account with that email already exists. Try signing in instead.");
        }

        Customer customer = null;
        if (role == Role.CUSTOMER) {
            String company = req.companyName == null ? "" : req.companyName.trim();
            if (company.isEmpty()) {
                throw new BadRequestException("Company name is required for a customer account.");
            }
            customer = customerRepository.findByNameIgnoreCase(company)
                    .orElseGet(() -> customerRepository.save(new Customer(company, email)));
        }

        User user = userRepository.save(new User(email, name, passwordEncoder.encode(req.password), role, customer));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getName());
        Long customerId = customer != null ? customer.getId() : null;
        return new AuthDtos.LoginResponse(token, user.getId(), user.getEmail(), user.getName(), user.getRole().name(), customerId);
    }

    private boolean isStrongEnough(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        boolean hasLetter = password.chars().anyMatch(Character::isLetter);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        return hasLetter && hasDigit;
    }

    public AuthDtos.LoginResponse login(String email, String rawPassword) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getName());
        Long customerId = user.getCustomer() != null ? user.getCustomer().getId() : null;
        return new AuthDtos.LoginResponse(token, user.getId(), user.getEmail(), user.getName(), user.getRole().name(), customerId);
    }

    @Transactional(readOnly = true)
    public User currentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Session user no longer exists"));
        // Force the lazy "customer" link to load now, while the session is open, so callers
        // can safely read user.getCustomer() later even outside this transaction.
        Hibernate.initialize(user.getCustomer());
        return user;
    }
}
