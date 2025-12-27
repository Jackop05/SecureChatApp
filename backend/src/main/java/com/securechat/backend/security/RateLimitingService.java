package com.securechat.backend.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class RateLimitingService {
    
    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

    // Stores IP -> attempts count
    private final Map<String, Integer> attempts = new ConcurrentHashMap<>();
    // Stores IP -> block expiration time
    private final Map<String, Long> blocks = new ConcurrentHashMap<>();

    public void checkBlocked(String key) {
        if (blocks.containsKey(key)) {
            if (System.currentTimeMillis() < blocks.get(key)) {
                throw new RuntimeException("Too many attempts. Try again later.");
            } else {
                blocks.remove(key); // Block expired
                attempts.remove(key);
            }
        }
    }

    public void loginFailed(String key) {
        int attemptsCount = attempts.getOrDefault(key, 0);
        attemptsCount++;
        attempts.put(key, attemptsCount);

        if (attemptsCount >= MAX_ATTEMPTS) {
            blocks.put(key, System.currentTimeMillis() + BLOCK_DURATION_MS);
        }
    }

    public void loginSucceeded(String key) {
        attempts.remove(key);
        blocks.remove(key);
    }
}
