package com.sliit.smartcampus.booking.dto;

public record ResourceResponse(
        Long id,
        String name,
        String type,
        Integer capacity,
        String location,
        String description,
        String status) {
}
