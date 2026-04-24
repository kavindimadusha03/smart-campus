package com.sliit.smartcampus.ticket.dto;

public record UpdateTicketRequest(
        Long assignedTo,
        String status,
        String resolutionNotes,
        String rejectionReason) {
}
