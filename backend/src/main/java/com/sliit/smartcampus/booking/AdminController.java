package com.sliit.smartcampus.booking;

import com.sliit.smartcampus.booking.dto.AdminDashboardStatsResponse;
import com.sliit.smartcampus.booking.dto.TopResourceResponse;
import com.sliit.smartcampus.booking.dto.TopUserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BookingService bookingService;

    public AdminController(BookingService bookingService) {
        this.bookingService = bookingService;
    }


    @GetMapping("/top-resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<TopResourceResponse>> getTopResources(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(bookingService.getTopResources(limit));
    }

    @GetMapping("/top-users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<TopUserResponse>> getTopUsers(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(bookingService.getTopUsers(limit));
    }

}

