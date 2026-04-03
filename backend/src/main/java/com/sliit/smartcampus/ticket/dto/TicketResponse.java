package com.sliit.smartcampus.ticket.dto;

import java.time.Instant;
import java.util.List;

public record TicketResponse(
        Long id,
        String code,
        String title,
        String description,
        String category,
        String priority,
        String status,
        String location,
        Long resourceId,
        String resourceName,
        String contactEmail,
        String contactPhone,
        Long createdById,
        String createdByName,
        String createdByAvatar,
        Long assignedToId,
        String assignedToName,
        String assignedToAvatar,
        String rejectionReason,
        String resolutionNotes,
        Instant firstResponseAt,
        Long timeToFirstResponseMinutes,
        Instant resolvedAt,
        Instant closedAt,
        Long timeToResolutionMinutes,
        Instant createdAt,
        Instant updatedAt,
        List<TicketAttachmentResponse> attachments) {
}