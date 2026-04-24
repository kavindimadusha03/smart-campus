package com.sliit.smartcampus.resource.dto;

public record AvailabilityWindowRequest(
        String dayOfWeek,
        String startTime,
        String endTime) {
}
