package com.sliit.smartcampus.booking.dto;

import java.time.LocalDate;

public record TicketTrendResponse(
        LocalDate date,
        long inProgress,
        long resolved,
        long closed,
        long rejected) {
}

