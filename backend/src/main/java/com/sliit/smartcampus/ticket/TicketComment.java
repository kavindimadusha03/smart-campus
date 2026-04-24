package com.sliit.smartcampus.ticket;

import java.time.Instant;

public record TicketComment(
        Long id,
        Long ticketId,
        Long userId,
        String content,
        boolean isEdited,
        Instant createdAt,
        Instant updatedAt) {
}
