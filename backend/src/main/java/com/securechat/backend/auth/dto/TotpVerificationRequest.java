package com.securechat.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TotpVerificationRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String code;
}
