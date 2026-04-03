package com.sliit.smartcampus.ticket.dto;

public record TicketAttachmentResponse(
        Long id,
        String fileName,
        String filePath,
        String fileType,
        long fileSize) {
}
