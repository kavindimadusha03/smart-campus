package com.sliit.smartcampus.notification.dto;

public record NotificationResponse(
        Long id,
        Long userId,
        String title,
        String message,
        String type,
        String referenceType,
        Long referenceId,
        boolean isRead,
        String createdAt) {
}
