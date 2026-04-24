package com.sliit.smartcampus.resource.dto;

import java.util.List;

public record UpdateResourceRequest(
        String name,
        String type,
        Integer capacity,
        String location,
        String description,
        String imageUrl,
        List<AvailabilityWindowRequest> availabilityWindows) {
}
