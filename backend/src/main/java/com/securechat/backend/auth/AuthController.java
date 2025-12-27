package com.securechat.backend.auth;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.securechat.backend.auth.dto.LoginRequest;
import com.securechat.backend.auth.dto.RegisterRequest;
import com.securechat.backend.auth.dto.TotpVerificationRequest;
import com.securechat.backend.security.RateLimitingService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimitingService rateLimitingService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        rateLimitingService.checkBlocked(ip);
        try {
            var response = authService.login(request);
            rateLimitingService.loginSucceeded(ip);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            rateLimitingService.loginFailed(ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2fa(@Valid @RequestBody TotpVerificationRequest request, HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        rateLimitingService.checkBlocked(ip);
        try {
            var response = authService.verify2faAndLogin(request);
            rateLimitingService.loginSucceeded(ip);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            rateLimitingService.loginFailed(ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid code");
        }
    }

    @PostMapping("/2fa/setup")
    public ResponseEntity<String> setup2fa(Principal principal) {
        String secret = authService.setup2fa(principal.getName());
        return ResponseEntity.ok(secret);
    }

    @PostMapping("/2fa/confirm")
    public ResponseEntity<String> confirm2fa(@Valid @RequestBody TotpVerificationRequest request, Principal principal) {
        // Używamy nazwy użytkownika z tokenu (Principal), ignorując to co przyszło w body (dla bezpieczeństwa i wygody)
        authService.confirm2faSetup(principal.getName(), request.getCode());
        return ResponseEntity.ok("2FA enabled successfully");
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<String> disable2fa(Principal principal) {
        authService.disable2fa(principal.getName());
        return ResponseEntity.ok("2FA disabled successfully");
    }
}
