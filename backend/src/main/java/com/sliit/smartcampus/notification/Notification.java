package com.sliit.smartcampus.notification;

import java.time.Instant;

public record Notification(
        Long id,
        Long userId,
        String title,
        String message,
        String type,
        String referenceType,
        Long referenceId,
        boolean isRead,
        Instant createdAt) {
}
