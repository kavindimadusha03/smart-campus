package com.sliit.smartcampus.ticket.dto;

import java.time.Instant;

public record TicketCommentResponse(
        Long id,
        Long userId,
        String userName,
        String userRole,
        String content,
        boolean isEdited,
        Instant createdAt) {
}
