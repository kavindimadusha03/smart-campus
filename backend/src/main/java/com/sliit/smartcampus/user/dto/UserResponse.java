package com.sliit.smartcampus.user.dto;

public record UserResponse(
        Long id,
        String email,
        String name,
        String profilePicture,
        String role,
        boolean isActive,
        String createdAt) {
}
