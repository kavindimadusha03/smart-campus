package com.sliit.smartcampus.booking;

import com.sliit.smartcampus.auth.User;
import com.sliit.smartcampus.auth.UserRepository;
import com.sliit.smartcampus.booking.dto.AvailabilityResponse;
import com.sliit.smartcampus.booking.dto.BookingResponse;
import com.sliit.smartcampus.booking.dto.CreateBookingRequest;
import com.sliit.smartcampus.booking.dto.DashboardStatsResponse;
import com.sliit.smartcampus.booking.dto.ResourceResponse;
import com.sliit.smartcampus.booking.dto.ReviewBookingRequest;
import com.sliit.smartcampus.booking.dto.TimeSlot;
import com.sliit.smartcampus.booking.dto.SuggestionResponse;
import com.sliit.smartcampus.booking.dto.TopResourceResponse;
import com.sliit.smartcampus.booking.dto.TopUserResponse;
import com.sliit.smartcampus.notification.NotificationService;
import java.time.Duration;
import java.util.Map;


import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class BookingService {

    private static final Set<String> REVIEW_STATUSES = Set.of("APPROVED", "REJECTED");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_INSTANT;

    private final BookingRepository bookingRepository;
    private final BookingResourceRepository bookingResourceRepository;
    // private final ResourceRepository resourceRepository; // for similar resources later
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
                          BookingResourceRepository bookingResourceRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.bookingResourceRepository = bookingResourceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public BookingResponse createBooking(Long userId, CreateBookingRequest req) {
        Resource resource = bookingResourceRepository.findById(req.resourceId())
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        if (!"ACTIVE".equals(resource.status())) {
            throw new IllegalStateException("Resource is not available for booking");
        }

        LocalDate bookingDate = LocalDate.parse(req.bookingDate());
        LocalTime startTime = LocalTime.parse(req.startTime());
        LocalTime endTime = LocalTime.parse(req.endTime());

        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        String dayOfWeek = bookingDate.getDayOfWeek()
                .getDisplayName(TextStyle.FULL, Locale.ENGLISH).toUpperCase();

        List<AvailabilityWindow> windows = bookingResourceRepository
                .findAvailabilityWindows(req.resourceId(), dayOfWeek);

        if (windows.isEmpty() || !windows.stream().anyMatch(w ->
                    !startTime.isBefore(w.startTime()) && !endTime.isAfter(w.endTime()))) {
            throw new IllegalStateException(
                    "Booking unavailable for this day/time. Only available on configured days/windows (e.g. Monday 08:00-17:00 for G1105). Check resource schedule.");
        }

        List<Booking> conflicts = bookingRepository.findConflicting(
                req.resourceId(), bookingDate, startTime, endTime);
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException(
                    "Time slot conflicts with an existing booking");
        }

        Booking booking = bookingRepository.save(
                req.resourceId(), userId, bookingDate,
                startTime, endTime, req.purpose(), req.expectedAttendees());

        User user = userRepository.findById(userId).orElse(null);
        String userName = user != null ? user.name() : "A user";

        notificationService.notifyManagersAndAdmins(
                "NEW_BOOKING_REQUEST",
                "New Booking Request",
                userName + " requested to book " + resource.name(),
                "BOOKING",
                booking.id());

        return toResponse(booking);
    }

    public BookingResponse reviewBooking(Long reviewerId, Long bookingId, ReviewBookingRequest req) {
        if (!REVIEW_STATUSES.contains(req.status())) {
            throw new IllegalArgumentException("Status must be APPROVED or REJECTED");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!"PENDING".equals(booking.status())) {
            throw new IllegalStateException("Only PENDING bookings can be reviewed");
        }

        if ("REJECTED".equals(req.status()) &&
                (req.reviewReason() == null || req.reviewReason().isBlank())) {
            throw new IllegalArgumentException("Rejection reason is required");
        }

        bookingRepository.updateStatus(bookingId, req.status(), reviewerId, req.reviewReason());

        String notifType = "APPROVED".equals(req.status())
                ? "BOOKING_APPROVED" : "BOOKING_REJECTED";
        String title = "APPROVED".equals(req.status())
                ? "Booking Approved" : "Booking Rejected";

        Resource resource = bookingResourceRepository.findById(booking.resourceId()).orElse(null);
        String resourceName = resource != null ? resource.name() : "a resource";

        String message = "Your booking for " + resourceName + " has been " +
                req.status().toLowerCase();

        notificationService.notify(
                booking.userId(), notifType, title, message, "BOOKING", bookingId);

        return getBookingById(bookingId);
    }

    public BookingResponse cancelBooking(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.userId().equals(userId)) {
            throw new IllegalStateException("Only the booking owner can cancel");
        }

        if (!"PENDING".equals(booking.status()) && !"APPROVED".equals(booking.status())) {
            throw new IllegalStateException("Only PENDING or APPROVED bookings can be cancelled");
        }

        bookingRepository.cancelBooking(bookingId);
        return getBookingById(bookingId);
    }

    public List<BookingResponse> getMyBookings(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BookingResponse> getAllBookings(String status, Long resourceId,
                                               String dateFrom, String dateTo) {
        LocalDate from = dateFrom != null && !dateFrom.isBlank() ? LocalDate.parse(dateFrom) : null;
        LocalDate to = dateTo != null && !dateTo.isBlank() ? LocalDate.parse(dateTo) : null;
        return bookingRepository.findAll(status, resourceId, from, to).stream()
                .map(this::toResponse)
                .toList();
    }

    public Map<String, Object> getMyBookingsPaginated(Long userId, String status, Long resourceId,
                                                       String dateFrom, String dateTo,
                                                       int page, int limit) {
        LocalDate from = dateFrom != null && !dateFrom.isBlank() ? LocalDate.parse(dateFrom) : null;
        LocalDate to = dateTo != null && !dateTo.isBlank() ? LocalDate.parse(dateTo) : null;
        int offset = page * limit;

        List<BookingResponse> bookings = bookingRepository.findByUserIdPaginated(
                userId, status, resourceId, from, to, limit, offset).stream()
                .map(this::toResponse)
                .toList();
        int total = bookingRepository.countByUserId(userId, status, resourceId, from, to);

        return Map.of(
                "bookings", bookings,
                "total", total,
                "page", page,
                "limit", limit,
                "totalPages", (int) Math.ceil((double) total / limit));
    }

    public Map<String, Object> getAllBookingsPaginated(String status, Long resourceId,
                                                        String dateFrom, String dateTo,
                                                        int page, int limit) {
        LocalDate from = dateFrom != null && !dateFrom.isBlank() ? LocalDate.parse(dateFrom) : null;
        LocalDate to = dateTo != null && !dateTo.isBlank() ? LocalDate.parse(dateTo) : null;
        int offset = page * limit;

        List<BookingResponse> bookings = bookingRepository.findAllPaginated(
                status, resourceId, from, to, limit, offset).stream()
                .map(this::toResponse)
                .toList();
        int total = bookingRepository.countAll(status, resourceId, from, to);

        return Map.of(
                "bookings", bookings,
                "total", total,
                "page", page,
                "limit", limit,
                "totalPages", (int) Math.ceil((double) total / limit));
    }

    public DashboardStatsResponse getDashboardStats(Long userId, String role) {
        long totalActive = bookingRepository.countActiveByUser(userId);
        long pendingApprovals = ("ADMIN".equals(role) || "MANAGER".equals(role))
                ? bookingRepository.countPendingApprovals() : 0L;
        long resourcesUsed = bookingRepository.countResourcesUsedThisMonth(userId);
        long upcomingThisWeek = bookingRepository.countUpcomingThisWeek(userId);
        long totalBookings = bookingRepository.countAllByUser(userId);
        long upcomingBookings = bookingRepository.countUpcomingByUser(userId);
        long pendingBookings = bookingRepository.countPendingByUser(userId);
        long cancelledBookings = bookingRepository.countCancelledByUser(userId);
        return new DashboardStatsResponse(totalActive, pendingApprovals, resourcesUsed, upcomingThisWeek,
                totalBookings, upcomingBookings, pendingBookings, cancelledBookings);
    }

    public void deleteBooking(Long userId, String role, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        boolean isAdmin = "ADMIN".equals(role);
        boolean isOwner = booking.userId().equals(userId);

        if (!isOwner && !isAdmin) {
            throw new IllegalStateException("Not authorized to delete this booking");
        }

        bookingRepository.deleteBooking(bookingId);
    }

    public BookingResponse updateBookingStatus(Long userId, String role, Long bookingId, String status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        boolean isAdmin = "ADMIN".equals(role);
        boolean isManager = "MANAGER".equals(role);
        boolean isOwner = booking.userId().equals(userId);

        if ("CANCELLED".equals(status)) {
            if (!isOwner && !isAdmin) {
                throw new IllegalStateException("Only owner or admin can cancel");
            }
            if (!"PENDING".equals(booking.status()) && !"APPROVED".equals(booking.status())) {
                throw new IllegalStateException("Only PENDING or APPROVED bookings can be cancelled");
            }
            bookingRepository.updateStatus(bookingId, "CANCELLED");
        } else if ("APPROVED".equals(status) || "REJECTED".equals(status)) {
            if (!isAdmin && !isManager) {
                throw new IllegalStateException("Only admin or manager can approve/reject");
            }
            if (!"PENDING".equals(booking.status())) {
                throw new IllegalStateException("Only PENDING bookings can be reviewed");
            }
            bookingRepository.updateStatus(bookingId, status);
        } else {
            throw new IllegalArgumentException("Invalid status transition");
        }

        return getBookingById(bookingId);
    }

    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        return toResponse(booking);
    }

    public List<BookingResponse> getSchedule(Long resourceId, String date) {
        try {
            // Validate date format
            LocalDate localDate = LocalDate.parse(date);
            
            // Check resource exists and active
            Resource resource = bookingResourceRepository.findById(resourceId).orElse(null);
            if (resource == null || !"ACTIVE".equals(resource.status())) {
                return List.of(); // Empty list for inactive/missing resource
            }
            
            return bookingRepository.findByResourceAndDate(resourceId, localDate).stream()
                    .map(this::toResponse)
                    .toList();
        } catch (Exception e) {
            // Log error, return empty - prevents 500
            System.err.println("Error fetching schedule for resourceId=" + resourceId + ", date=" + date + ": " + e.getMessage());
            return List.of();
        }
    }

    public List<AvailabilityResponse> getAvailability(Long resourceId, String date) {
        LocalDate localDate = LocalDate.parse(date);
        String dayOfWeek = localDate.getDayOfWeek()
                .getDisplayName(TextStyle.FULL, Locale.ENGLISH).toUpperCase();
        return bookingResourceRepository.findAvailabilityWindows(resourceId, dayOfWeek).stream()
                .map(w -> new AvailabilityResponse(
                        w.dayOfWeek(),
                        w.startTime().format(TIME_FMT),
                        w.endTime().format(TIME_FMT)))
                .toList();
    }

    public List<AvailabilityResponse> getAvailabilityWindows(Long resourceId, String dayOfWeek) {
        return bookingResourceRepository.findAvailabilityWindows(resourceId, dayOfWeek).stream()
                .map(w -> new AvailabilityResponse(
                        w.dayOfWeek(),
                        w.startTime().format(TIME_FMT),
                        w.endTime().format(TIME_FMT)))
                .toList();
    }

    public List<ResourceResponse> getActiveResources() {
        return bookingResourceRepository.findAllActive().stream()
                .map(r -> new ResourceResponse(
                        r.id(), r.name(), r.type(), r.capacity(),
                        r.location(), r.description(), r.status()))
                .toList();
    }

    public List<TimeSlot> getAvailableSlots(Long resourceId, String dateStr, int durationMinutes) {
        LocalDate date = LocalDate.parse(dateStr);
        String dayOfWeek = date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH).toUpperCase();
        List<AvailabilityWindow> windows = bookingResourceRepository.findAvailabilityWindows(resourceId, dayOfWeek);
        List<BookingResponse> schedule = getSchedule(resourceId, dateStr);

        List<TimeSlot> slots = new java.util.ArrayList<>();

        for (AvailabilityWindow window : windows) {
            LocalTime slotStart = window.startTime();
            while (slotStart.plusMinutes(durationMinutes).isBefore(window.endTime()) || slotStart.plusMinutes(durationMinutes).equals(window.endTime())) {
                LocalTime slotEnd = slotStart.plusMinutes(durationMinutes);

                boolean overlaps = false;
                for (BookingResponse booking : schedule) {
                    LocalTime bStart = LocalTime.parse(booking.startTime());
                    LocalTime bEnd = LocalTime.parse(booking.endTime());
                    if (!(slotEnd.isBefore(bStart) || slotStart.isAfter(bEnd))) {
                        overlaps = true;
                        break;
                    }
                }

                if (!overlaps) {
                    slots.add(new TimeSlot(slotStart.format(TIME_FMT), slotEnd.format(TIME_FMT)));
                    if (slots.size() >= 20) break;
                }

                slotStart = slotStart.plusMinutes(30);
            }
            if (slots.size() >= 20) break;
        }

        slots.sort((a, b) -> a.startTime().compareTo(b.startTime()));
        return slots;
    }

    public SuggestionResponse getSmartSuggestions(Long resourceId, String dateStr, String reqStartStr, String reqEndStr) {
        LocalDate date = LocalDate.parse(dateStr);
        LocalTime reqStart = LocalTime.parse(reqStartStr);
        LocalTime reqEnd = LocalTime.parse(reqEndStr);
        long durationMinutes = java.time.Duration.between(reqStart, reqEnd).toMinutes();

        // Get existing bookings for the day
        List<BookingResponse> schedule = getSchedule(resourceId, dateStr);
        List<LocalTime> occupiedStarts = schedule.stream()
                .map(b -> LocalTime.parse(b.startTime()))
                .sorted()
                .toList();
        List<LocalTime> occupiedEnds = schedule.stream()
                .map(b -> LocalTime.parse(b.endTime()))
                .sorted()
                .toList();

        // Find gaps
        List<TimeSlot> nextSlots = new java.util.ArrayList<>();
        LocalTime dayStart = LocalTime.of(0, 0);
        LocalTime dayEnd = LocalTime.of(23, 59);
        LocalTime prevEnd = dayStart;

        for (int i = 0; i < occupiedStarts.size(); i++) {
            LocalTime gapStart = prevEnd;
            LocalTime gapEnd = occupiedStarts.get(i);
            if (java.time.Duration.between(gapStart, gapEnd).toMinutes() >= durationMinutes) {
                nextSlots.add(new TimeSlot(gapStart.format(TIME_FMT), gapEnd.format(TIME_FMT)));
                if (nextSlots.size() >= 3) break;
            }
            prevEnd = occupiedEnds.get(i);
        }

        // After last booking
        LocalTime gapStart = prevEnd;
        LocalTime gapEnd = dayEnd;
        if (java.time.Duration.between(gapStart, gapEnd).toMinutes() >= durationMinutes) {
            nextSlots.add(new TimeSlot(gapStart.format(TIME_FMT), gapEnd.format(TIME_FMT)));
        }

        // Sort by start time
        nextSlots.sort((a, b) -> reqStartStr.compareTo(a.startTime()));
        nextSlots = nextSlots.subList(0, Math.min(3, nextSlots.size()));

        // Similar resources (simple: query all active same type/capacity, check availability)
        Resource currRes = bookingResourceRepository.findById(resourceId).orElse(null);
        List<ResourceResponse> alternatives = new java.util.ArrayList<>();
        if (currRes != null) {
            // Mock similar - in real, query other repos
            alternatives.add(new ResourceResponse(999L, "Lab 2 (same capacity: " + currRes.capacity() + " seats)", currRes.type(), currRes.capacity(), "Nearby", "", "ACTIVE"));
        }

        return new SuggestionResponse(nextSlots, alternatives);
    }

    public List<TopResourceResponse> getTopResources(int limit) {
        return bookingRepository.findTopResources(limit).stream()
                .map(row -> new TopResourceResponse(
                        ((Number) row.get("resource_id")).longValue(),
                        (String) row.get("resource_name"),
                        (String) row.get("resource_location"),
                        ((Number) row.get("booking_count")).longValue()))
                .toList();
    }

    public List<TopUserResponse> getTopUsers(int limit) {
        return bookingRepository.findTopUsers(limit).stream()
                .map(row -> new TopUserResponse(
                        ((Number) row.get("user_id")).longValue(),
                        (String) row.get("user_name"),
                        (String) row.get("user_email"),
                        ((Number) row.get("booking_count")).longValue()))
                .toList();
    }

    private BookingResponse toResponse(Booking b) {
        Resource resource = bookingResourceRepository.findById(b.resourceId()).orElse(null);
        User user = userRepository.findById(b.userId()).orElse(null);
        User reviewer = b.reviewedBy() != null
                ? userRepository.findById(b.reviewedBy()).orElse(null) : null;

        return new BookingResponse(
                b.id(),
                b.resourceId(),
                resource != null ? resource.name() : null,
                resource != null ? resource.type() : null,
                resource != null ? resource.location() : null,
                b.userId(),
                user != null ? user.name() : null,
                user != null ? user.email() : null,
                b.bookingDate().format(DATE_FMT),
                b.startTime().format(TIME_FMT),
                b.endTime().format(TIME_FMT),
                b.purpose(),
                b.expectedAttendees(),
                b.status(),
                b.reviewedBy(),
                reviewer != null ? reviewer.name() : null,
                b.reviewReason(),
                b.reviewedAt() != null ? b.reviewedAt().atOffset(ZoneOffset.UTC).format(ISO_FMT) : null,
                b.createdAt().atOffset(ZoneOffset.UTC).format(ISO_FMT));
    }
}