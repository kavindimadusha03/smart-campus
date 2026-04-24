package com.sliit.smartcampus.ticket.dto;

import java.time.Instant;

public record TicketListResponse(
        Long id,
        String code,
        String title,
        String category,
        String priority,
        String status,
        String location,
        String assignedToName,
        Instant createdAt) {
}
