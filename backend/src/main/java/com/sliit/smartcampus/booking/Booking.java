package com.sliit.smartcampus.booking;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record Booking(
        Long id,
        Long resourceId,
        Long userId,
        LocalDate bookingDate,
        LocalTime startTime,
        LocalTime endTime,
        String purpose,
        Integer expectedAttendees,
        String status,
        Long reviewedBy,
        String reviewReason,
        Instant reviewedAt,
        Instant createdAt,
        Instant updatedAt) {
}
