package com.securechat.backend.message;

import com.securechat.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByReceiverOrderBySentAtDesc(User receiver);
    List<Message> findBySenderOrderBySentAtDesc(User sender);

}
