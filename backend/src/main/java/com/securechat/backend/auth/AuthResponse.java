package com.securechat.backend.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String token;
    
    @JsonProperty("isTwoFactorEnabled")
    private boolean isTwoFactorEnabled;
    
    private String encryptedPrivateKey;
    private String keySalt;
}
