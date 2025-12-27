package com.securechat.backend.message.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Receiver username is required")
    private String receiverName;

    @NotBlank(message = "Encrypted content is required")
    private String encryptedContent;

    @NotBlank(message = "Encrypted session key is required")
    private String encryptedSessionKey;

    @NotBlank(message = "Digital signature is required")
    private String signature;

    @NotBlank(message = "IV is required")
    private String iv;
}
