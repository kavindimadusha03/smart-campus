package com.sliit.smartcampus.booking.dto;

public record TopResourceResponse(
        Long resourceId,
        String resourceName,
        String resourceLocation,
        Long bookingCount) {
}

