package com.sliit.smartcampus.notification;

import com.sliit.smartcampus.auth.User;
import com.sliit.smartcampus.auth.UserRepository;
import com.sliit.smartcampus.notification.dto.NotificationPageResponse;
import com.sliit.smartcampus.notification.dto.NotificationResponse;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NotificationService {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_INSTANT;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // ── Public API methods (called by controller) ──

    public NotificationPageResponse getNotifications(Long userId, int page, int size) {
        List<Notification> notifications = notificationRepository.findByUserId(userId, page, size);
        long totalElements = notificationRepository.countByUserId(userId);
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int unreadCount = notificationRepository.countUnreadByUserId(userId);

        List<NotificationResponse> items = notifications.stream()
                .map(this::toResponse)
                .toList();

        return new NotificationPageResponse(items, page, totalPages, totalElements, unreadCount);
    }

    public int getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.userId().equals(userId)) {
            throw new IllegalArgumentException("Notification does not belong to user");
        }

        notificationRepository.markAsRead(notificationId);
        return toResponse(new Notification(
                notification.id(), notification.userId(), notification.title(),
                notification.message(), notification.type(), notification.referenceType(),
                notification.referenceId(), true, notification.createdAt()));
    }

    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllAsRead(userId);
    }

    public void deleteNotification(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.userId().equals(userId)) {
            throw new IllegalArgumentException("Notification does not belong to user");
        }

        notificationRepository.deleteById(notificationId);
    }

    // ── Internal methods (called by teammates' services) ──

    public void notify(Long userId, String type, String title,
                       String message, String referenceType, Long referenceId) {
        notificationRepository.save(userId, title, message, type, referenceType, referenceId);
    }

    public void notifyManagersAndAdmins(String type, String title,
                                        String message, String referenceType, Long referenceId) {
        List<User> recipients = userRepository.findByRoles(List.of("MANAGER", "ADMIN"));
        for (User user : recipients) {
            notificationRepository.save(user.id(), title, message, type, referenceType, referenceId);
        }
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.id(),
                n.userId(),
                n.title(),
                n.message(),
                n.type(),
                n.referenceType(),
                n.referenceId(),
                n.isRead(),
                n.createdAt().atOffset(ZoneOffset.UTC).format(ISO_FMT));
    }
}
