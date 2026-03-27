package com.sliit.smartcampus.ticket;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class TicketCommentRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<TicketComment> ROW_MAPPER = (rs, rowNum) -> new TicketComment(
            rs.getLong("id"),
            rs.getLong("ticket_id"),
            rs.getLong("user_id"),
            rs.getString("content"),
            rs.getBoolean("is_edited"),
            rs.getTimestamp("created_at").toInstant(),
            rs.getTimestamp("updated_at").toInstant());

    public TicketCommentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TicketComment> findByTicketId(Long ticketId) {
        return jdbcTemplate.query(
                "SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_at ASC",
                ROW_MAPPER, ticketId);
    }

    public Optional<TicketComment> findById(Long id) {
        List<TicketComment> results = jdbcTemplate.query(
                "SELECT * FROM ticket_comments WHERE id = ?",
                ROW_MAPPER, id);
        return results.stream().findFirst();
    }

    public TicketComment save(Long ticketId, Long userId, String content) {
        Timestamp now = Timestamp.from(Instant.now());
        jdbcTemplate.update(
                """
                INSERT INTO ticket_comments (ticket_id, user_id, content, is_edited, created_at, updated_at)
                VALUES (?, ?, ?, FALSE, ?, ?)
                """,
                ticketId, userId, content, now, now);

        List<TicketComment> results = jdbcTemplate.query(
                "SELECT * FROM ticket_comments WHERE ticket_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1",
                ROW_MAPPER, ticketId, userId);
        return results.get(0);
    }

    public int update(Long id, String content) {
        Timestamp now = Timestamp.from(Instant.now());
        return jdbcTemplate.update(
                "UPDATE ticket_comments SET content = ?, is_edited = TRUE, updated_at = ? WHERE id = ?",
                content, now, id);
    }

    public int deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM ticket_comments WHERE id = ?", id);
    }
}
