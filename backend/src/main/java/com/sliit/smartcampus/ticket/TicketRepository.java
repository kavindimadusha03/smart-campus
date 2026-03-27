package com.sliit.smartcampus.ticket;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class TicketRepository {

    private final JdbcTemplate jdbcTemplate;

   private static final RowMapper<Ticket> ROW_MAPPER = (rs, rowNum) -> new Ticket(
        rs.getLong("id"),
        rs.getObject("resource_id") != null ? rs.getLong("resource_id") : null,
        rs.getLong("created_by"),
        rs.getObject("assigned_to") != null ? rs.getLong("assigned_to") : null,
        rs.getString("title"),
        rs.getString("description"),
        rs.getString("category"),
        rs.getString("priority"),
        rs.getString("status"),
        rs.getString("location"),
        rs.getString("contact_email"),
        rs.getString("contact_phone"),
        rs.getString("rejection_reason"),
        rs.getString("resolution_notes"),
        rs.getTimestamp("first_response_at") != null ? rs.getTimestamp("first_response_at").toInstant() : null,
        rs.getTimestamp("resolved_at") != null ? rs.getTimestamp("resolved_at").toInstant() : null,
        rs.getTimestamp("closed_at") != null ? rs.getTimestamp("closed_at").toInstant() : null,
        rs.getTimestamp("created_at").toInstant(),
        rs.getTimestamp("updated_at").toInstant());

    public TicketRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<Ticket> findById(Long id) {
        List<Ticket> results = jdbcTemplate.query(
                "SELECT * FROM tickets WHERE id = ?",
                ROW_MAPPER, id);
        return results.stream().findFirst();
    }

    public List<Ticket> findByCreatedBy(Long userId) {
        return jdbcTemplate.query(
                "SELECT * FROM tickets WHERE created_by = ? ORDER BY created_at DESC",
                ROW_MAPPER, userId);
    }

    public List<Ticket> findByAssignedTo(Long userId) {
        return jdbcTemplate.query(
                "SELECT * FROM tickets WHERE assigned_to = ? ORDER BY created_at DESC",
                ROW_MAPPER, userId);
    }

    public List<Ticket> findAll(String category, String priority, String status, String search) {
        StringBuilder sql = new StringBuilder("SELECT * FROM tickets WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (category != null && !category.isBlank()) {
            sql.append(" AND category = ?");
            params.add(category);
        }
        if (priority != null && !priority.isBlank()) {
            sql.append(" AND priority = ?");
            params.add(priority);
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND status = ?");
            params.add(status);
        }
        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(title) LIKE ? OR LOWER(location) LIKE ?)");
            String pattern = "%" + search.toLowerCase() + "%";
            params.add(pattern);
            params.add(pattern);
        }

        sql.append(" ORDER BY created_at DESC");
        return jdbcTemplate.query(sql.toString(), ROW_MAPPER, params.toArray());
    }

    public Ticket save(Long resourceId, Long createdBy, String title, String description,
                       String category, String priority, String location,
                       String contactEmail, String contactPhone) {
        Timestamp now = Timestamp.from(Instant.now());
        jdbcTemplate.update(
                """
                INSERT INTO tickets (resource_id, created_by, title, description, category,
                    priority, status, location, contact_email, contact_phone, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?)
                """,
                resourceId, createdBy, title, description, category,
                priority, location, contactEmail, contactPhone, now, now);

        List<Ticket> results = jdbcTemplate.query(
                "SELECT * FROM tickets WHERE created_by = ? ORDER BY created_at DESC LIMIT 1",
                ROW_MAPPER, createdBy);
        return results.get(0);
    }

    public int updateAssignment(Long id, Long assignedTo) {
        Timestamp now = Timestamp.from(Instant.now());
        return jdbcTemplate.update(
                "UPDATE tickets SET assigned_to = ?, updated_at = ? WHERE id = ?",
                assignedTo, now, id);
    }

    public int updateStatus(Long id, String status, String resolutionNotes) {
        Timestamp now = Timestamp.from(Instant.now());
        StringBuilder sql = new StringBuilder("UPDATE tickets SET status = ?, updated_at = ?");
        List<Object> params = new ArrayList<>();
        params.add(status);
        params.add(now);

        if (resolutionNotes != null) {
            sql.append(", resolution_notes = ?");
            params.add(resolutionNotes);
        }
        if ("RESOLVED".equals(status)) {
            sql.append(", resolved_at = ?");
            params.add(now);
        }
        if ("CLOSED".equals(status)) {
            sql.append(", closed_at = ?");
            params.add(now);
        }

        sql.append(" WHERE id = ?");
        params.add(id);
        return jdbcTemplate.update(sql.toString(), params.toArray());
    }

    public int markFirstResponseIfUnset(Long id) {
    Timestamp now = Timestamp.from(Instant.now());
    return jdbcTemplate.update(
            "UPDATE tickets SET first_response_at = ? WHERE id = ? AND first_response_at IS NULL",
            now, id);
}

    public int reject(Long id, String rejectionReason) {
        Timestamp now = Timestamp.from(Instant.now());
        return jdbcTemplate.update(
                "UPDATE tickets SET status = 'REJECTED', rejection_reason = ?, updated_at = ? WHERE id = ?",
                rejectionReason, now, id);
    }
  public int deleteById(Long id) {
    jdbcTemplate.update("DELETE FROM ticket_attachments WHERE ticket_id = ?", id);
    jdbcTemplate.update("DELETE FROM ticket_comments WHERE ticket_id = ?", id);
    jdbcTemplate.update(
            "DELETE FROM notifications WHERE reference_type IN ('TICKET', 'COMMENT') AND reference_id = ?",
            id
    );
    return jdbcTemplate.update("DELETE FROM tickets WHERE id = ?", id);
}
}