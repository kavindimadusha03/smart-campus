package com.sliit.smartcampus.resource.dto;

import java.util.List;

public record ResourceResponse(
        Long id,
        String name,
        String type,
        Integer capacity,
        String location,
        String description,
        String imageUrl,
        String status,
        Long createdBy,
        String createdByName,
        String createdAt,
        String updatedAt,
        List<AvailabilityWindowResponse> availabilityWindows,

         // ✅ NEW FIELD - booking count
        Long bookingCountLastMonth,

        // ✅ NEW FIELD - badge
        String popularityBadge,
        Double averageRating

) {
}
