package com.sliit.smartcampus.ticket;

import java.time.Instant;

public record Ticket(
        Long id,
        Long resourceId,
        Long createdBy,
        Long assignedTo,
        String title,
        String description,
        String category,
        String priority,
        String status,
        String location,
        String contactEmail,
        String contactPhone,
        String rejectionReason,
        String resolutionNotes,
        Instant firstResponseAt,
        Instant resolvedAt,
        Instant closedAt,
        Instant createdAt,
        Instant updatedAt) {
}
