package com.sliit.smartcampus.ticket;

import java.time.Instant;

public record TicketAttachment(
        Long id,
        Long ticketId,
        String fileName,
        String filePath,
        String fileType,
        long fileSize,
        Instant uploadedAt) {
}
