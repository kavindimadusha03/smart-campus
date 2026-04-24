package com.sliit.smartcampus.notification;

import com.sliit.smartcampus.auth.User;
import com.sliit.smartcampus.auth.UserRepository;
import com.sliit.smartcampus.notification.dto.NotificationPageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User(1L, "user@test.com", "Test User", null,
                "GOOGLE", "gid", "USER", true, Instant.now(), Instant.now());
    }

    @Test
    void notify_createsNotification() {
        notificationService.notify(1L, "BOOKING_APPROVED",
                "Booking Approved", "Your booking was approved", "BOOKING", 1L);

        verify(notificationRepository).save(eq(1L), eq("Booking Approved"),
                eq("Your booking was approved"), eq("BOOKING_APPROVED"),
                eq("BOOKING"), eq(1L));
    }

    @Test
    void notifyManagersAndAdmins_notifiesAllManagersAndAdmins() {
        User manager = new User(2L, "mgr@test.com", "Manager", null,
                "GOOGLE", "gid2", "MANAGER", true, Instant.now(), Instant.now());
        User admin = new User(3L, "admin@test.com", "Admin", null,
                "GOOGLE", "gid3", "ADMIN", true, Instant.now(), Instant.now());

        when(userRepository.findByRoles(List.of("MANAGER", "ADMIN")))
                .thenReturn(List.of(manager, admin));

        notificationService.notifyManagersAndAdmins("NEW_TICKET",
                "New Ticket", "A new ticket", "TICKET", 1L);

        verify(notificationRepository, times(2)).save(
                anyLong(), eq("New Ticket"), eq("A new ticket"),
                eq("NEW_TICKET"), eq("TICKET"), eq(1L));
    }

    @Test
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countUnreadByUserId(1L)).thenReturn(5);

        int count = notificationService.getUnreadCount(1L);

        assertEquals(5, count);
    }

    @Test
    void markAsRead_updatesNotification() {
        Notification notification = new Notification(1L, 1L, "Title", "Message",
                "BOOKING_APPROVED", "BOOKING", 1L, false, Instant.now());
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(1L, 1L);

        verify(notificationRepository).markAsRead(1L);
    }

    @Test
    void markAsRead_wrongUser_throwsException() {
        Notification notification = new Notification(1L, 2L, "Title", "Message",
                "BOOKING_APPROVED", "BOOKING", 1L, false, Instant.now());
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(IllegalArgumentException.class,
                () -> notificationService.markAsRead(1L, 1L));
    }
}
