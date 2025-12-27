package com.securechat.backend.auth;

import org.springframework.stereotype.Service;

import com.securechat.backend.auth.dto.LoginRequest;
import com.securechat.backend.auth.dto.RegisterRequest;
import com.securechat.backend.auth.dto.TotpVerificationRequest;
import com.securechat.backend.config.JwtService;
import com.securechat.backend.crypto.Argon2PasswordEncoder;
import com.securechat.backend.user.User;
import com.securechat.backend.user.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final Argon2PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TotpService totpService;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User newUser = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .publicKey(request.getPublicKey())
                .encryptedPrivateKey(request.getEncryptedPrivateKey())
                .keySalt(request.getKeySalt())
                .isTwoFactorEnabled(false)
                .build();

        userRepository.save(newUser);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getLogin())
                .or(() -> userRepository.findByEmail(request.getLogin()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        if (user.isTwoFactorEnabled()) {
            return AuthResponse.builder()
                    .token(null)
                    .isTwoFactorEnabled(true)
                    .build();
        }

        String token = jwtService.generateToken(user.getUsername());
        return AuthResponse.builder()
                .token(token)
                .isTwoFactorEnabled(user.isTwoFactorEnabled())
                .encryptedPrivateKey(user.getEncryptedPrivateKey())
                .keySalt(user.getKeySalt())
                .build();
    }

    public AuthResponse verify2faAndLogin(TotpVerificationRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.isTwoFactorEnabled()) {
            throw new IllegalArgumentException("2FA is not enabled for this user");
        }

        if (!totpService.verifyCode(user.getTwoFactorSecret(), request.getCode())) {
            throw new IllegalArgumentException("Invalid 2FA code");
        }

        String token = jwtService.generateToken(user.getUsername());
        return AuthResponse.builder()
                .token(token)
                .isTwoFactorEnabled(true)
                .encryptedPrivateKey(user.getEncryptedPrivateKey())
                .keySalt(user.getKeySalt())
                .build();
    }

    @Transactional
    public String setup2fa(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String secret = totpService.generateSecret();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        return secret;
    }

    @Transactional
    public void confirm2faSetup(String username, String code) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!totpService.verifyCode(user.getTwoFactorSecret(), code)) {
            throw new IllegalArgumentException("Invalid verification code");
        }

        user.setTwoFactorEnabled(true);
        userRepository.save(user);
    }

    @Transactional
    public void disable2fa(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
    }
}
