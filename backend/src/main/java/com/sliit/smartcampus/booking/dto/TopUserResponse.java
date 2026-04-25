package com.sliit.smartcampus.booking.dto;

public record TopUserResponse(
        Long userId,
        String userName,
        String userEmail,
        Long bookingCount) {
}

