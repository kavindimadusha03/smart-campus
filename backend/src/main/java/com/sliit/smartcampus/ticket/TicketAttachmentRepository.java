package com.sliit.smartcampus.ticket;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
public class TicketAttachmentRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<TicketAttachment> ROW_MAPPER = (rs, rowNum) -> new TicketAttachment(
            rs.getLong("id"),
            rs.getLong("ticket_id"),
            rs.getString("file_name"),
            rs.getString("file_path"),
            rs.getString("file_type"),
            rs.getLong("file_size"),
            rs.getTimestamp("uploaded_at").toInstant());

    public TicketAttachmentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TicketAttachment> findByTicketId(Long ticketId) {
        return jdbcTemplate.query(
                "SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY uploaded_at ASC",
                ROW_MAPPER, ticketId);
    }

    public TicketAttachment save(Long ticketId, String fileName, String filePath,
                                 String fileType, long fileSize) {
        Timestamp now = Timestamp.from(Instant.now());
        jdbcTemplate.update(
                """
                INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_type, file_size, uploaded_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                ticketId, fileName, filePath, fileType, fileSize, now);

        List<TicketAttachment> results = jdbcTemplate.query(
                "SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY uploaded_at DESC LIMIT 1",
                ROW_MAPPER, ticketId);
        return results.get(0);
    }

    public int deleteById(Long id) {
        return jdbcTemplate.update("DELETE FROM ticket_attachments WHERE id = ?", id);
    }
}
