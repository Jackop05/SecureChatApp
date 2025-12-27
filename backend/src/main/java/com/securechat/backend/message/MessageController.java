package com.securechat.backend.message;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.securechat.backend.message.dto.MessageListItem;
import com.securechat.backend.message.dto.MessageResponse;
import com.securechat.backend.message.dto.SendMessageRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<String> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            Principal principal
    ) {
        messageService.sendMessage(principal.getName(), request);
        return ResponseEntity.ok("Message sent successfully");
    }

    @GetMapping("/inbox")
    public ResponseEntity<List<MessageListItem>> getInbox(Principal principal) {
        return ResponseEntity.ok(messageService.getInbox(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MessageResponse> getMessage(
            @PathVariable UUID id,
            Principal principal
    ) {
        return ResponseEntity.ok(messageService.getMessage(id, principal.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMessage(
            @PathVariable UUID id,
            Principal principal
    ) {
        messageService.deleteMessage(id, principal.getName());
        return ResponseEntity.ok("Message deleted");
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable UUID id,
            Principal principal
    ) {
        messageService.markAsRead(id, principal.getName());
        return ResponseEntity.ok().build();
    }

}
