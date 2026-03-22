package com.sliit.smartcampus.resource.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CreateResourceRequest(
        @NotBlank(message = "Name is required") String name,
        @NotBlank(message = "Type is required") String type,
        @Positive(message = "Capacity must be positive") Integer capacity,
        @NotBlank(message = "Location is required") String location,
        String description,
        String imageUrl,
        String status,
        List<AvailabilityWindowRequest> availabilityWindows) {
}
