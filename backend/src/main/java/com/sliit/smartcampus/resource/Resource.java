package com.sliit.smartcampus.resource;

import java.time.Instant;

public record Resource(
        Long id,
        String name,
        String type,
        Integer capacity,
        String location,
        String description,
        String imageUrl,
        String status,
        Long createdBy,
        Instant createdAt,
        Instant updatedAt,
        Double averageRating) {
}
