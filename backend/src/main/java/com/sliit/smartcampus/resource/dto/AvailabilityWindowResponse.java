package com.sliit.smartcampus.resource.dto;

public record AvailabilityWindowResponse(
        Long id,
        String dayOfWeek,
        String startTime,
        String endTime) {
}
