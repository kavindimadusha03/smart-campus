package com.sliit.smartcampus.booking.dto;

public record DashboardStatsResponse(
        long totalActive,
        long pendingApprovals,
        long resourcesUsed,
        long upcomingThisWeek,
        long totalBookings,
        long upcomingBookings,
        long pendingBookings,
        long cancelledBookings) {
}

