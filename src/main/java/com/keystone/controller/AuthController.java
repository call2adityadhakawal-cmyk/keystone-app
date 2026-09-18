package com.keystone.controller;

import com.keystone.dto.AuthDtos;
import com.keystone.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return authService.login(req.email, req.password);
    }

    /** Public sign-up for customers and technicians. Returns a token so the new user lands straight in the app. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthDtos.LoginResponse register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
        return authService.register(req);
    }
}
