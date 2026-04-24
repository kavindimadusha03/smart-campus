package com.sliit.smartcampus.booking.dto;

public record AvailabilityResponse(
        String dayOfWeek,
        String startTime,
        String endTime) {
}
