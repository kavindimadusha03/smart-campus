package com.sliit.smartcampus.resource;

import com.sliit.smartcampus.resource.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private AvailabilityWindowRepository availabilityWindowRepository;

    @InjectMocks
    private ResourceService resourceService;

    private Resource sampleResource;

    @BeforeEach
    void setUp() {
        sampleResource = new Resource(
                1L, "Lab 101", "LAB", 30, "Building A",
                "Physics Lab", null, "ACTIVE", 1L,
                Instant.now(), Instant.now(),0.0);
    }

    @Test
    void getResource_existingId_returnsResponse() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(availabilityWindowRepository.findByResourceId(1L)).thenReturn(List.of());
        when(resourceRepository.findCreatedByName(1L)).thenReturn("Admin");

        ResourceResponse response = resourceService.getResource(1L);

        assertEquals("Lab 101", response.name());
        assertEquals("LAB", response.type());
        assertEquals(30, response.capacity());
    }

    @Test
    void getResource_nonExistentId_throwsException() {
        when(resourceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> resourceService.getResource(999L));
    }

    @Test
    void createResource_invalidType_throwsException() {
        CreateResourceRequest request = new CreateResourceRequest(
                "Test", "INVALID_TYPE", 10, "Loc", null, null, null, null);

        assertThrows(IllegalArgumentException.class,
                () -> resourceService.createResource(1L, request));
    }

    @Test
    void createResource_blankName_throwsException() {
        CreateResourceRequest request = new CreateResourceRequest(
                "", "LAB", 10, "Location", null, null, null, null);

        assertThrows(IllegalArgumentException.class,
                () -> resourceService.createResource(1L, request));
    }

    @Test
    void createResource_validRequest_returnsResponse() {
        CreateResourceRequest request = new CreateResourceRequest(
                "New Lab", "LAB", 20, "Building B", "Description", null, null,
                List.of(new AvailabilityWindowRequest("MONDAY", "09:00", "17:00")));

        when(resourceRepository.save(anyString(), anyString(), anyInt(), anyString(),
                anyString(), isNull(), eq("ACTIVE"), eq(1L))).thenReturn(1L);
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));
        when(availabilityWindowRepository.findByResourceId(1L)).thenReturn(List.of());
        when(resourceRepository.findCreatedByName(anyLong())).thenReturn("Admin");

        ResourceResponse response = resourceService.createResource(1L, request);

        assertNotNull(response);
        verify(availabilityWindowRepository).saveAll(eq(1L), anyList());
    }

    @Test
    void updateStatus_invalidStatus_throwsException() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(sampleResource));

        UpdateStatusRequest request = new UpdateStatusRequest("BROKEN");

        assertThrows(IllegalArgumentException.class,
                () -> resourceService.updateStatus(1L, request));
    }

    @Test
    void deleteResource_nonExistent_throwsException() {
        when(resourceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> resourceService.deleteResource(999L));
    }

    @Test
    void getResources_returnsPagedResponse() {
        when(resourceRepository.findAll(isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), eq(0), eq(12)))
                .thenReturn(List.of(sampleResource));
        when(resourceRepository.count(isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull())).thenReturn(1L);
        when(availabilityWindowRepository.findByResourceId(1L)).thenReturn(List.of());
        when(resourceRepository.findCreatedByName(anyLong())).thenReturn("Admin");

        ResourceListResponse response = resourceService.getResources(
                null, null, null, null, null, null, 0, 12);

        assertEquals(1, response.resources().size());
        assertEquals(1, response.totalPages());
    }
}
