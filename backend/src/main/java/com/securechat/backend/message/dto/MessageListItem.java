package com.securechat.backend.message.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MessageListItem {
    private UUID id;
    private String senderUsername;
    private boolean isRead;
    private LocalDateTime sentAt;
}
