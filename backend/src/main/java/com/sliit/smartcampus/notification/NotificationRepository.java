package com.sliit.smartcampus.notification;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class NotificationRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<Notification> ROW_MAPPER = (ResultSet rs, int rowNum) -> new Notification(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getString("title"),
            rs.getString("message"),
            rs.getString("type"),
            rs.getString("reference_type"),
            rs.getObject("reference_id") != null ? rs.getLong("reference_id") : null,
            rs.getBoolean("is_read"),
            rs.getTimestamp("created_at").toInstant());

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Notification> findByUserId(Long userId, int page, int size) {
        int offset = page * size;
        return jdbcTemplate.query(
                "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                ROW_MAPPER, userId, size, offset);
    }

    public Optional<Notification> findById(Long id) {
        List<Notification> results = jdbcTemplate.query(
                "SELECT * FROM notifications WHERE id = ?",
                ROW_MAPPER, id);
        return results.stream().findFirst();
    }

    public long countByUserId(Long userId) {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE user_id = ?",
                Long.class, userId);
        return count != null ? count : 0;
    }

    public int countUnreadByUserId(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE",
                Integer.class, userId);
        return count != null ? count : 0;
    }

    public Notification save(Long userId, String title, String message,
                             String type, String referenceType, Long referenceId) {
        Timestamp now = Timestamp.from(Instant.now());
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, FALSE, ?)
                """,
                userId, title, message, type, referenceType, referenceId, now);

        List<Notification> results = jdbcTemplate.query(
                "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
                ROW_MAPPER, userId);
        return results.get(0);
    }

    public int markAsRead(Long id) {
        return jdbcTemplate.update(
                "UPDATE notifications SET is_read = TRUE WHERE id = ?", id);
    }

    public int markAllAsRead(Long userId) {
        return jdbcTemplate.update(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
                userId);
    }

    public int deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM notifications WHERE id = ?", id);
    }
}
