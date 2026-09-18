package com.keystone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    /**
     * Self-service sign-up. Only CUSTOMER and TECHNICIAN can be requested here -
     * DISPATCHER and MANAGER are internal admin roles and are rejected server-side.
     */
    public static class RegisterRequest {
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Name is too long")
        public String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        public String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
        public String password;

        @NotBlank(message = "Choose an account type")
        public String role;

        /** Required for CUSTOMER sign-ups: the company/organisation the login belongs to. */
        public String companyName;
    }

    public static class LoginRequest {
        @NotBlank
        public String email;
        @NotBlank
        public String password;
    }

    public static class LoginResponse {
        public String token;
        public Long id;
        public String email;
        public String name;
        public String role;
        public Long customerId; // only set for CUSTOMER role logins

        public LoginResponse(String token, Long id, String email, String name, String role, Long customerId) {
            this.token = token;
            this.id = id;
            this.email = email;
            this.name = name;
            this.role = role;
            this.customerId = customerId;
        }
    }
}
