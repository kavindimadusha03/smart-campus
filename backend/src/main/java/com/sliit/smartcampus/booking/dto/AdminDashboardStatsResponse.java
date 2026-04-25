package com.sliit.smartcampus.booking.dto;

import java.util.List;

public record AdminDashboardStatsResponse(
        long activeUsers,
        long inactiveUsers,
        long technicianCount,
        long activeResources,
        long totalBookings,
        long openTickets,
        long inProgressTickets,
        long resolvedTickets,
        long closedTickets,
        long rejectedTickets,
        List<TicketTrendResponse> ticketTrends) {
}

