package com.sliit.smartcampus.booking;

import java.time.Instant;

public record Resource(
        Long id,
        String name,
        String type,
        Integer capacity,
        String location,
        String description,
        String status,
        Long createdBy,
        Instant createdAt,
        Instant updatedAt) {
}
