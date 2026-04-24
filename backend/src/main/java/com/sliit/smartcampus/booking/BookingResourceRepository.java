package com.sliit.smartcampus.booking;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class BookingResourceRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<Resource> RESOURCE_MAPPER = (rs, rowNum) -> new Resource(
            rs.getLong("id"),
            rs.getString("name"),
            rs.getString("type"),
            rs.getObject("capacity") != null ? rs.getInt("capacity") : null,
            rs.getString("location"),
            rs.getString("description"),
            rs.getString("status"),
            rs.getLong("created_by"),
            rs.getTimestamp("created_at").toInstant(),
            rs.getTimestamp("updated_at").toInstant());

    private static final RowMapper<AvailabilityWindow> WINDOW_MAPPER = (rs, rowNum) -> new AvailabilityWindow(
            rs.getLong("id"),
            rs.getLong("resource_id"),
            rs.getString("day_of_week"),
            rs.getTime("start_time").toLocalTime(),
            rs.getTime("end_time").toLocalTime(),
            rs.getTimestamp("created_at").toInstant());

    public BookingResourceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<Resource> findById(Long id) {
        List<Resource> results = jdbcTemplate.query(
                "SELECT * FROM resources WHERE id = ?",
                RESOURCE_MAPPER, id);
        return results.stream().findFirst();
    }

    public List<Resource> findAllActive() {
        return jdbcTemplate.query(
                "SELECT * FROM resources WHERE status = 'ACTIVE' ORDER BY name",
                RESOURCE_MAPPER);
    }

    public List<AvailabilityWindow> findAvailabilityWindows(Long resourceId, String dayOfWeek) {
        return jdbcTemplate.query(
                "SELECT * FROM availability_windows WHERE resource_id = ? AND day_of_week = ?",
                WINDOW_MAPPER, resourceId, dayOfWeek);
    }
}
