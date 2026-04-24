package com.sliit.smartcampus.auth;

import com.sliit.smartcampus.auth.dto.AuthResponse;
import com.sliit.smartcampus.auth.dto.UpdateProfileRequest;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final GoogleTokenVerifier googleTokenVerifier;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(GoogleTokenVerifier googleTokenVerifier,
                       UserRepository userRepository,
                       JwtService jwtService) {
        this.googleTokenVerifier = googleTokenVerifier;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AuthResponse authenticateWithGoogle(String googleCredential) {
        GoogleTokenVerifier.GoogleUserInfo googleUser = googleTokenVerifier.verify(googleCredential);

        User user = userRepository.findByEmail(googleUser.email())
                .orElseGet(() -> userRepository.save(
                        googleUser.email(),
                        googleUser.name(),
                        googleUser.pictureUrl(),
                        "GOOGLE",
                        googleUser.googleId()));

        if (!user.isActive()) {
            throw new IllegalStateException("Account is deactivated");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, toDto(user));
    }

    public AuthResponse.UserDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toDto(user);
    }

    public AuthResponse.UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String name = request.name();
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }

        String profilePicture = request.profilePicture() != null
                ? request.profilePicture() : user.profilePicture();

        userRepository.updateProfile(userId, name.trim(), profilePicture);

        User updated = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve updated user"));
        return toDto(updated);
    }

    private AuthResponse.UserDto toDto(User user) {
        return new AuthResponse.UserDto(
                user.id(), user.email(), user.name(), user.profilePicture(), user.role());
    }
}
