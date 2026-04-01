package com.sliit.smartcampus.resource;

import com.sliit.smartcampus.resource.dto.*;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;

@Service
public class ResourceService {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_INSTANT;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private static final Set<String> VALID_TYPES = Set.of(
            "LECTURE_HALL", "LAB", "MEETING_ROOM", "PROJECTOR","CAMERAS_RECORDING_DEVICES", "SPORTS_RECREATION_FACILITIES", 
            "EVENT_AUDITORIUM_SPACES", "TRANSPORT_VEHICLES", "OTHER_EQUIPMENT");
    private static final Set<String> VALID_STATUSES = Set.of("ACTIVE", "OUT_OF_SERVICE");
    private static final Set<String> VALID_DAYS = Set.of(
            "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY");

    private final ResourceRepository resourceRepository;
    private final AvailabilityWindowRepository availabilityWindowRepository;

    public ResourceService(ResourceRepository resourceRepository,
                           AvailabilityWindowRepository availabilityWindowRepository) {
        this.resourceRepository = resourceRepository;
        this.availabilityWindowRepository = availabilityWindowRepository;
    }

    public ResourceListResponse getResources(String type, String status, String search,
                                             String location, Integer minCapacity, Integer maxCapacity,
                                             int page, int size) {

        List<Resource> resources = resourceRepository.findAll(type, status, search, location, minCapacity, maxCapacity, page, size);
        long totalElements = resourceRepository.count(type, status, search, location, minCapacity, maxCapacity);
        int totalPages = (int) Math.ceil((double) totalElements / size);

        // ✅ NEW - get booking counts (last 30 days)
        List<ResourceBookingCount> bookingCounts = resourceRepository.findBookingCountsLastMonth();

        // ✅ NEW - store booking counts
        java.util.Map<Long, Long> countMap = new java.util.HashMap<>();

        for (ResourceBookingCount rbc : bookingCounts) {
            countMap.put(rbc.resourceId(), rbc.bookingCount());
        }

        // ✅ UPDATED mapping with threshold-based badge
        List<ResourceResponse> items = resources.stream()
                .map(r -> {
                    Long count = countMap.getOrDefault(r.id(), 0L);

                    return toResponse(
                            r,
                            availabilityWindowRepository.findByResourceId(r.id()),
                            count,
                            getBadge(count) // ✅ NEW - badge based on count
                    );
                })
                .toList();

        return new ResourceListResponse(items, page, totalPages, totalElements);
    }

    public ResourceResponse getResource(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        List<AvailabilityWindow> windows = availabilityWindowRepository.findByResourceId(id);

        // ✅ fallback (no booking count here)
        return toResponse(resource, windows, 0L, null);
    }

    public ResourceResponse createResource(Long userId, CreateResourceRequest request) {
        validateType(request.type());
        String status = request.status() != null ? request.status() : "ACTIVE";
        validateStatus(status);
        validateAvailabilityWindows(request.availabilityWindows());

        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (request.location() == null || request.location().isBlank()) {
            throw new IllegalArgumentException("Location is required");
        }

        Long resourceId = resourceRepository.save(
                request.name(), request.type(), request.capacity(),
                request.location(), request.description(), request.imageUrl(), status, userId);

        if (request.availabilityWindows() != null && !request.availabilityWindows().isEmpty()) {
            availabilityWindowRepository.saveAll(resourceId, request.availabilityWindows());
        }

        Resource saved = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve created resource"));

        List<AvailabilityWindow> windows = availabilityWindowRepository.findByResourceId(resourceId);

        return toResponse(saved, windows, 0L, null);
    }

    public ResourceResponse updateResource(Long id, UpdateResourceRequest request) {
        resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        validateType(request.type());
        validateAvailabilityWindows(request.availabilityWindows());

        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (request.location() == null || request.location().isBlank()) {
            throw new IllegalArgumentException("Location is required");
        }

        resourceRepository.update(id, request.name(), request.type(),
                request.capacity(), request.location(), request.description(), request.imageUrl());

        availabilityWindowRepository.deleteByResourceId(id);
        if (request.availabilityWindows() != null && !request.availabilityWindows().isEmpty()) {
            availabilityWindowRepository.saveAll(id, request.availabilityWindows());
        }

        Resource updated = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve updated resource"));

        List<AvailabilityWindow> windows = availabilityWindowRepository.findByResourceId(id);

        return toResponse(updated, windows, 0L, null);
    }

    public ResourceResponse updateStatus(Long id, UpdateStatusRequest request) {
        resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        validateStatus(request.status());

        resourceRepository.updateStatus(id, request.status());

        Resource updated = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve updated resource"));

        List<AvailabilityWindow> windows = availabilityWindowRepository.findByResourceId(id);

        return toResponse(updated, windows, 0L, null);
    }

    public void deleteResource(Long id) {
        resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        resourceRepository.deleteById(id);
    }

    // ✅ UPDATED METHOD (already correct)
    private ResourceResponse toResponse(Resource r,
                                        List<AvailabilityWindow> windows,
                                        Long bookingCount,
                                        String badge) {

        String createdByName = resourceRepository.findCreatedByName(r.createdBy());

        List<AvailabilityWindowResponse> windowResponses = windows.stream()
                .map(w -> new AvailabilityWindowResponse(
                        w.id(),
                        w.dayOfWeek(),
                        w.startTime().format(TIME_FMT),
                        w.endTime().format(TIME_FMT)))
                .toList();

        return new ResourceResponse(
                r.id(),
                r.name(),
                r.type(),
                r.capacity(),
                r.location(),
                r.description(),
                r.imageUrl(),
                r.status(),
                r.createdBy(),
                createdByName,
                r.createdAt().atOffset(ZoneOffset.UTC).format(ISO_FMT),
                r.updatedAt().atOffset(ZoneOffset.UTC).format(ISO_FMT),
                windowResponses,

                // ✅ NEW VALUES
                bookingCount,
                badge,
                r.averageRating()
        );
    }

    // ✅ NEW METHOD - threshold-based badge logic
    private String getBadge(Long count) {
        if (count == null) return null;

        if (count >= 10) return "GOLD";
        if (count >= 5) return "SILVER";
        if (count >= 1) return "BRONZE";

        return null; // no badge
    }

    private void validateType(String type) {
        if (type == null || !VALID_TYPES.contains(type)) {
            throw new IllegalArgumentException("Invalid resource type: " + type
                    + ". Must be one of: " + VALID_TYPES);
        }
    }

    private void validateStatus(String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Invalid status: " + status
                    + ". Must be one of: " + VALID_STATUSES);
        }
    }

    private void validateAvailabilityWindows(List<AvailabilityWindowRequest> windows) {
        if (windows == null) return;

        for (AvailabilityWindowRequest w : windows) {
            if (w.dayOfWeek() == null || !VALID_DAYS.contains(w.dayOfWeek())) {
                throw new IllegalArgumentException("Invalid day of week: " + w.dayOfWeek());
            }
            if (w.startTime() == null || w.endTime() == null) {
                throw new IllegalArgumentException("Start time and end time are required");
            }
        }
    }


    //new method to ratings
    // Add this method to your ResourceService.java
public void rateResource(Long resourceId, Long userId, Integer rating) {
    // Basic validation
    if (rating < 1 || rating > 5) {
        throw new IllegalArgumentException("Rating must be between 1 and 5");
    }
    
    // Check if resource exists
    resourceRepository.findById(resourceId)
            .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

    resourceRepository.saveRating(resourceId, userId, rating);
}
}