package com.sliit.smartcampus.auth;

import java.time.Instant;

public record User(
        Long id,
        String email,
        String name,
        String profilePicture,
        String provider,
        String providerId,
        String role,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt) {
}
