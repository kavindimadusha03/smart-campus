package com.sliit.smartcampus.booking.dto;

public record BookingResponse(
        Long id,
        Long resourceId,
        String resourceName,
        String resourceType,
        String resourceLocation,
        Long userId,
        String userName,
        String userEmail,
        String bookingDate,
        String startTime,
        String endTime,
        String purpose,
        Integer expectedAttendees,
        String status,
        Long reviewedBy,
        String reviewerName,
        String reviewReason,
        String reviewedAt,
        String createdAt) {
}
