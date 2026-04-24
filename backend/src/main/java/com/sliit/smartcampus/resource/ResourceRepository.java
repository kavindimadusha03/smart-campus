package com.sliit.smartcampus.resource;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ResourceRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<Resource> ROW_MAPPER = (ResultSet rs, int rowNum) -> new Resource(
            rs.getLong("id"),
            rs.getString("name"),
            rs.getString("type"),
            rs.getObject("capacity") != null ? rs.getInt("capacity") : null,
            rs.getString("location"),
            rs.getString("description"),
            rs.getString("image_url"),
            rs.getString("status"),
            rs.getLong("created_by"),
            rs.getTimestamp("created_at").toInstant(),
            rs.getTimestamp("updated_at").toInstant(),
            rs.getDouble("average_rating")
        );

    public ResourceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Resource> findAll(String type, String status, String search, String location,
                                  Integer minCapacity, Integer maxCapacity, int page, int size) {
        StringBuilder sql = new StringBuilder("SELECT * FROM resources WHERE 1=1");
        List<Object> params = new ArrayList<>();

        appendFilters(sql, params, type, status, search, location, minCapacity, maxCapacity);

        sql.append(" ORDER BY created_at DESC LIMIT ? OFFSET ?");
        params.add(size);
        params.add(page * size);

        return jdbcTemplate.query(sql.toString(), ROW_MAPPER, params.toArray());
    }

    public long count(String type, String status, String search, String location,
                      Integer minCapacity, Integer maxCapacity) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM resources WHERE 1=1");
        List<Object> params = new ArrayList<>();

        appendFilters(sql, params, type, status, search, location, minCapacity, maxCapacity);

        Long count = jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0;
    }

    public Optional<Resource> findById(Long id) {
        List<Resource> results = jdbcTemplate.query(
                "SELECT * FROM resources WHERE id = ?",
                ROW_MAPPER, id);
        return results.stream().findFirst();
    }

    public String findCreatedByName(Long userId) {
        List<String> results = jdbcTemplate.query(
                "SELECT name FROM users WHERE id = ?",
                (rs, rowNum) -> rs.getString("name"), userId);
        return results.isEmpty() ? "Unknown" : results.get(0);
    }

    public Long save(String name, String type, Integer capacity, String location,
                     String description, String imageUrl, String status, Long createdBy) {
        Timestamp now = Timestamp.from(Instant.now());
        jdbcTemplate.update("""
                INSERT INTO resources (name, type, capacity, location, description, image_url, status, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                name, type, capacity, location, description, imageUrl, status, createdBy, now, now);

        Long id = jdbcTemplate.queryForObject(
                "SELECT id FROM resources WHERE created_by = ? ORDER BY created_at DESC LIMIT 1",
                Long.class, createdBy);
        return id;
    }

    public int update(Long id, String name, String type, Integer capacity,
                      String location, String description, String imageUrl) {
        Timestamp now = Timestamp.from(Instant.now());
        return jdbcTemplate.update("""
                UPDATE resources SET name = ?, type = ?, capacity = ?, location = ?, description = ?, image_url = ?, updated_at = ?
                WHERE id = ?
                """,
                name, type, capacity, location, description, imageUrl, now, id);
    }

    public int updateStatus(Long id, String status) {
        Timestamp now = Timestamp.from(Instant.now());
        return jdbcTemplate.update(
                "UPDATE resources SET status = ?, updated_at = ? WHERE id = ?",
                status, now, id);
    }

    public int deleteById(Long id) {
        jdbcTemplate.update(
                "DELETE FROM ticket_comments WHERE ticket_id IN (SELECT id FROM tickets WHERE resource_id = ?)", id);
        jdbcTemplate.update(
                "DELETE FROM ticket_attachments WHERE ticket_id IN (SELECT id FROM tickets WHERE resource_id = ?)", id);
        jdbcTemplate.update("DELETE FROM tickets WHERE resource_id = ?", id);
        jdbcTemplate.update("DELETE FROM bookings WHERE resource_id = ?", id);
        return jdbcTemplate.update("DELETE FROM resources WHERE id = ?", id);
    }

    private void appendFilters(StringBuilder sql, List<Object> params,
                               String type, String status, String search, String location,
                               Integer minCapacity, Integer maxCapacity) {
        if (type != null && !type.isBlank()) {
            sql.append(" AND type = ?");
            params.add(type);
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND status = ?");
            params.add(status);
        }
        if (search != null && !search.isBlank()) {
            sql.append(" AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)");
            String pattern = "%" + search.toLowerCase() + "%";
            params.add(pattern);
            params.add(pattern);
        }
        if (location != null && !location.isBlank()) {
            sql.append(" AND LOWER(location) LIKE ?");
            params.add("%" + location.toLowerCase() + "%");
        }
        if (minCapacity != null) {
            sql.append(" AND capacity >= ?");
            params.add(minCapacity);
        }
        if (maxCapacity != null) {
            sql.append(" AND capacity <= ?");
            params.add(maxCapacity);
        }
    }

    // ✅ NEW METHOD - get booking counts for last 30 days
public List<ResourceBookingCount> findBookingCountsLastMonth() {
    return jdbcTemplate.query("""
        SELECT r.id AS resource_id, COUNT(b.id) AS booking_count
        FROM resources r
        LEFT JOIN bookings b 
            ON r.id = b.resource_id
            AND b.booking_date >= NOW() - INTERVAL '30 days'
        GROUP BY r.id
        ORDER BY booking_count DESC
        """,
        (rs, rowNum) -> new ResourceBookingCount(
                rs.getLong("resource_id"),
                rs.getLong("booking_count")
        )
    );
}

    //new method to add ratings 
    public void saveRating(Long resourceId, Long userId, Integer rating) {
    // Upsert rating (Update if exists, else insert)
    jdbcTemplate.update("""
        INSERT INTO resource_ratings (resource_id, user_id, rating_value)
        VALUES (?, ?, ?)
        ON CONFLICT (resource_id, user_id) 
        DO UPDATE SET rating_value = EXCLUDED.rating_value
        """, resourceId, userId, rating);
    
    // Recalculate and update the average in resources table
    jdbcTemplate.update("""
        UPDATE resources 
        SET average_rating = (
            SELECT AVG(rating_value) 
            FROM resource_ratings 
            WHERE resource_id = ?
        )
        WHERE id = ?
        """, resourceId, resourceId);
}

}


