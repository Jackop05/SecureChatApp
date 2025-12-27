package com.securechat.backend.message.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageResponse {
    private UUID id;
    private String senderUsername;
    private String encryptedContent;
    private String encryptedSessionKey;
    private String signature;
    private String iv;
    private boolean isRead;
    private LocalDateTime sentAt;
}
