package com.securechat.backend.message;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.securechat.backend.message.dto.MessageListItem;
import com.securechat.backend.message.dto.MessageResponse;
import com.securechat.backend.message.dto.SendMessageRequest;
import com.securechat.backend.user.User;
import com.securechat.backend.user.UserRepository;

import lombok.Builder;
import lombok.RequiredArgsConstructor;

@Service
@Builder
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Transactional
    public void sendMessage(String senderUsername, SendMessageRequest request) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        User receiver = userRepository.findByUsername(request.getReceiverName())
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .encryptedContent(request.getEncryptedContent())
                .encryptedSessionKey(request.getEncryptedSessionKey())
                .signature(request.getSignature())
                .iv(request.getIv())
                .isRead(false)
                .build();

        messageRepository.save(message);
    }

    public List<MessageListItem> getInbox(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return messageRepository.findByReceiverOrderBySentAtDesc(user).stream()
                .map(this::toListItem)
                .collect(Collectors.toList());
    }

    public MessageResponse getMessage(java.util.UUID messageId, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getReceiver().getUsername().equals(username)) {
            throw new IllegalArgumentException("Access denied");
        }

        return toResponse(message);
    }

    @Transactional
    public void markAsRead(java.util.UUID messageId, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        if (!message.getReceiver().getUsername().equals(username)) {
            throw new IllegalArgumentException("Access denied");
        }

        message.setRead(true);
        messageRepository.save(message);
    }

    // Optional helper to delete a message
    @Transactional
    public void deleteMessage(java.util.UUID messageId, String username) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        // Ensure only the receiver can delete it (or sender, depending on logic)
        if (!message.getReceiver().getUsername().equals(username)) {
            throw new IllegalArgumentException("You can only delete your own received messages");
        }

        messageRepository.delete(message);
    }

    private MessageResponse toResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderUsername(message.getSender().getUsername())
                .encryptedContent(message.getEncryptedContent())
                .encryptedSessionKey(message.getEncryptedSessionKey())
                .signature(message.getSignature())
                .iv(message.getIv())
                .isRead(message.isRead())
                .sentAt(message.getSentAt())
                .build();
    }

    private MessageListItem toListItem(Message message) {
        return MessageListItem.builder()
                .id(message.getId())
                .senderUsername(message.getSender().getUsername())
                .isRead(message.isRead())
                .sentAt(message.getSentAt())
                .build();
    }
}
