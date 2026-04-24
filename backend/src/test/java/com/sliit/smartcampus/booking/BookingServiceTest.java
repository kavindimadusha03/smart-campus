package com.sliit.smartcampus.booking;

import com.sliit.smartcampus.auth.User;
import com.sliit.smartcampus.auth.UserRepository;
import com.sliit.smartcampus.booking.dto.BookingResponse;
import com.sliit.smartcampus.booking.dto.CreateBookingRequest;
import com.sliit.smartcampus.booking.dto.ReviewBookingRequest;
import com.sliit.smartcampus.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private BookingResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    private Resource activeResource;
    private User sampleUser;
    private Booking pendingBooking;

    @BeforeEach
    void setUp() {
        activeResource = new Resource(1L, "Lab 101", "LAB", 30, "Building A",
                "Desc", "ACTIVE", 1L, Instant.now(), Instant.now());
        sampleUser = new User(1L, "user@test.com", "Test User", null,
                "GOOGLE", "gid", "USER", true, Instant.now(), Instant.now());
        pendingBooking = new Booking(1L, 1L, 1L,
                LocalDate.of(2026, 5, 1), LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Meeting", 10, "PENDING", null, null, null, Instant.now(), Instant.now());
    }

    @Test
    void createBooking_resourceNotFound_throwsException() {
        when(resourceRepository.findById(999L)).thenReturn(Optional.empty());

        CreateBookingRequest request = new CreateBookingRequest(
                999L, "2026-05-01", "09:00", "10:00", "Meeting", 10);

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(1L, request));
    }

    @Test
    void createBooking_inactiveResource_throwsException() {
        Resource inactive = new Resource(1L, "Lab", "LAB", 30, "A",
                null, "OUT_OF_SERVICE", 1L, Instant.now(), Instant.now());
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(inactive));

        CreateBookingRequest request = new CreateBookingRequest(
                1L, "2026-05-01", "09:00", "10:00", "Meeting", 10);

        assertThrows(IllegalStateException.class,
                () -> bookingService.createBooking(1L, request));
    }

    @Test
    void createBooking_endBeforeStart_throwsException() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(activeResource));

        CreateBookingRequest request = new CreateBookingRequest(
                1L, "2026-05-01", "10:00", "09:00", "Meeting", 10);

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.createBooking(1L, request));
    }

    @Test
    void createBooking_conflictExists_throwsException() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(activeResource));
        when(resourceRepository.findAvailabilityWindows(eq(1L), anyString()))
                .thenReturn(List.of());
        

        CreateBookingRequest request = new CreateBookingRequest(
                1L, "2026-05-01", "09:00", "10:00", "Meeting", 10);

        assertThrows(IllegalStateException.class,
                () -> bookingService.createBooking(1L, request));
    }

    @Test
    void reviewBooking_invalidStatus_throwsException() {
        ReviewBookingRequest request = new ReviewBookingRequest("INVALID", null);

        assertThrows(IllegalArgumentException.class,
                () -> bookingService.reviewBooking(1L, 1L, request));
    }

    @Test
    void reviewBooking_notPending_throwsException() {
        Booking approved = new Booking(1L, 1L, 1L,
                LocalDate.of(2026, 5, 1), LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Meeting", 10, "APPROVED", 2L, null, Instant.now(), Instant.now(), Instant.now());
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(approved));

        ReviewBookingRequest request = new ReviewBookingRequest("REJECTED", "reason");

        assertThrows(IllegalStateException.class,
                () -> bookingService.reviewBooking(2L, 1L, request));
    }

    @Test
    void cancelBooking_notOwner_throwsException() {
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(pendingBooking));

        assertThrows(IllegalStateException.class,
                () -> bookingService.cancelBooking(999L, 1L));
    }

    @Test
    void cancelBooking_alreadyCancelled_throwsException() {
        Booking cancelled = new Booking(1L, 1L, 1L,
                LocalDate.of(2026, 5, 1), LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Meeting", 10, "CANCELLED", null, null, null, Instant.now(), Instant.now());
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(cancelled));

        assertThrows(IllegalStateException.class,
                () -> bookingService.cancelBooking(1L, 1L));
    }

    @Test
    void getMyBookings_returnsUserBookings() {
        when(bookingRepository.findByUserId(1L)).thenReturn(List.of(pendingBooking));
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(activeResource));
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(sampleUser));

        List<BookingResponse> result = bookingService.getMyBookings(1L);

        assertEquals(1, result.size());
        assertEquals("PENDING", result.get(0).status());
    }
}
