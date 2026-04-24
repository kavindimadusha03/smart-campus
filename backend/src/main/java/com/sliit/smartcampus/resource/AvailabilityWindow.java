package com.sliit.smartcampus.resource;

import java.time.Instant;
import java.time.LocalTime;

public record AvailabilityWindow(
        Long id,
        Long resourceId,
        String dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        Instant createdAt) {
}
