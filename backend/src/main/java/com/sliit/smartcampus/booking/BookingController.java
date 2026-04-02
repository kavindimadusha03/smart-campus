package com.sliit.smartcampus.booking;

import com.sliit.smartcampus.booking.dto.AvailabilityResponse;
import com.sliit.smartcampus.booking.dto.BookingResponse;
import com.sliit.smartcampus.booking.dto.CreateBookingRequest;
import com.sliit.smartcampus.booking.dto.DashboardStatsResponse;
import com.sliit.smartcampus.booking.dto.ResourceResponse;
import com.sliit.smartcampus.booking.dto.ReviewBookingRequest;
import com.sliit.smartcampus.booking.dto.SuggestionResponse;
import com.sliit.smartcampus.booking.dto.TimeSlot;
import com.sliit.smartcampus.booking.dto.TopResourceResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return ResponseEntity.ok(bookingService.getDashboardStats(userId, role));
    }

    @GetMapping("/bookings/my")
    public ResponseEntity<?> getMyBookings(
            Authentication auth,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        return ResponseEntity.ok(bookingService.getMyBookingsPaginated(
                userId, status, resourceId, dateFrom, dateTo, page, Math.min(limit, 100)));
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(bookingService.getAllBookingsPaginated(
                status, resourceId, dateFrom, dateTo, page, Math.min(limit, 100)));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable Long id, Authentication auth) {
        try {
            BookingResponse booking = bookingService.getBookingById(id);
            Long userId = Long.parseLong(auth.getPrincipal().toString());
            String role = auth.getAuthorities().iterator().next().getAuthority();
            boolean isOwner = booking.userId().equals(userId);
            boolean isManagerOrAdmin = "ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role);

            if (!isOwner && !isManagerOrAdmin) {
                return ResponseEntity.status(403).build();
            }
            return ResponseEntity.ok(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody CreateBookingRequest request, Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        try {
            BookingResponse booking = bookingService.createBooking(userId, request);
            return ResponseEntity.status(201).body(booking);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/bookings/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> reviewBooking(
            @PathVariable Long id,
            @RequestBody ReviewBookingRequest request,
            Authentication auth) {
        Long reviewerId = Long.parseLong(auth.getPrincipal().toString());
        try {
            return ResponseEntity.ok(bookingService.reviewBooking(reviewerId, id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long id, Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        try {
            return ResponseEntity.ok(bookingService.cancelBooking(userId, id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<?> deleteBooking(
            @PathVariable Long id, Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        try {
            bookingService.deleteBooking(userId, role, id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        String status = body.get("status");
        try {
            return ResponseEntity.ok(bookingService.updateBookingStatus(userId, role, id, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bookings/schedule")
    public ResponseEntity<List<BookingResponse>> getSchedule(
            @RequestParam Long resourceId,
            @RequestParam String date) {
        return ResponseEntity.ok(bookingService.getSchedule(resourceId, date));
    }

    @GetMapping("/bookings/availability")
    public ResponseEntity<List<AvailabilityResponse>> getAvailability(
            @RequestParam Long resourceId,
            @RequestParam(required = false) String date) {
        if (date == null || date.isBlank()) {
            // Return all availability windows across all days
            List<AvailabilityResponse> allWindows = new java.util.ArrayList<>();
            String[] days = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"};
            for (String day : days) {
                allWindows.addAll(bookingService.getAvailabilityWindows(resourceId, day));
            }
            return ResponseEntity.ok(allWindows);
        }
        return ResponseEntity.ok(bookingService.getAvailability(resourceId, date));
    }

    @GetMapping("/bookings/availability/full")
    public ResponseEntity<Map<String, List<AvailabilityResponse>>> getFullAvailability(
            @RequestParam Long resourceId) {
        java.util.Map<String, List<AvailabilityResponse>> availabilityMap = new java.util.HashMap<>();
        String[] days = {"MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"};
        for (String day : days) {
            availabilityMap.put(day, bookingService.getAvailabilityWindows(resourceId, day));
        }
        return ResponseEntity.ok(availabilityMap);
    }

    @GetMapping("/bookings/resources")
    public ResponseEntity<List<ResourceResponse>> getActiveResources() {
        return ResponseEntity.ok(bookingService.getActiveResources());
    }

    @GetMapping("/bookings/suggestions")
    public ResponseEntity<SuggestionResponse> getSuggestions(
            @RequestParam Long resourceId,
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        SuggestionResponse suggestions = bookingService.getSmartSuggestions(resourceId, date, startTime, endTime);
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/bookings/available-slots")
    public ResponseEntity<List<TimeSlot>> getAvailableSlots(
            @RequestParam Long resourceId,
            @RequestParam String date,
            @RequestParam(defaultValue = "60") int durationMin) {
        return ResponseEntity.ok(bookingService.getAvailableSlots(resourceId, date, durationMin));
    }

    @GetMapping("/bookings/top-resources")
    public ResponseEntity<List<TopResourceResponse>> getTopResources(
            @RequestParam(defaultValue = "1") int limit) {
        return ResponseEntity.ok(bookingService.getTopResources(limit));
    }
}