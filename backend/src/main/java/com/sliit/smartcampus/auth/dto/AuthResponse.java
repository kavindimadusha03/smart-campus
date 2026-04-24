package com.sliit.smartcampus.auth.dto;

public record AuthResponse(String token, UserDto user) {

    public record UserDto(Long id, String email, String name, String profilePicture, String role) {
    }
}
