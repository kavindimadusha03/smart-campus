package com.sliit.smartcampus.notification.dto;

import java.util.List;

public record NotificationPageResponse(
        List<NotificationResponse> notifications,
        int currentPage,
        int totalPages,
        long totalElements,
        int unreadCount) {
}
