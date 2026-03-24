package com.sliit.smartcampus.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateBookingRequest(
        @NotNull(message = "Resource ID is required") Long resourceId,
        @NotBlank(message = "Booking date is required") String bookingDate,
        @NotBlank(message = "Start time is required") String startTime,
        @NotBlank(message = "End time is required") String endTime,
        @NotBlank(message = "Purpose is required") String purpose,
        Integer expectedAttendees) {
}
