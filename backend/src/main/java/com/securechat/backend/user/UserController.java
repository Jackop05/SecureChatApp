package com.securechat.backend.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor

public class UserController {

    private final UserRepository userRepository;

    // Endpoint to search for a user and get their Public Key
    // Used by Frontend to encrypt messages before sending
    @GetMapping("/{username}/public-key")
    public ResponseEntity<Map<String, String>> getUserPublicKey(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getPublicKey() == null) {
            throw new IllegalArgumentException("User has no public key");
        }

        return ResponseEntity.ok(Map.of("publicKey", user.getPublicKey()));
    }

}
