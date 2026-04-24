package com.sliit.smartcampus.resource;

import com.sliit.smartcampus.resource.dto.AvailabilityWindowRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

@Repository
public class AvailabilityWindowRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<AvailabilityWindow> ROW_MAPPER = (ResultSet rs, int rowNum) -> new AvailabilityWindow(
            rs.getLong("id"),
            rs.getLong("resource_id"),
            rs.getString("day_of_week"),
            rs.getTime("start_time").toLocalTime(),
            rs.getTime("end_time").toLocalTime(),
            rs.getTimestamp("created_at").toInstant());

    public AvailabilityWindowRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<AvailabilityWindow> findByResourceId(Long resourceId) {
        return jdbcTemplate.query(
                "SELECT * FROM availability_windows WHERE resource_id = ? ORDER BY CASE day_of_week " +
                        "WHEN 'MONDAY' THEN 1 WHEN 'TUESDAY' THEN 2 WHEN 'WEDNESDAY' THEN 3 " +
                        "WHEN 'THURSDAY' THEN 4 WHEN 'FRIDAY' THEN 5 WHEN 'SATURDAY' THEN 6 " +
                        "WHEN 'SUNDAY' THEN 7 END, start_time",
                ROW_MAPPER, resourceId);
    }

    public void deleteByResourceId(Long resourceId) {
        jdbcTemplate.update("DELETE FROM availability_windows WHERE resource_id = ?", resourceId);
    }

    public void saveAll(Long resourceId, List<AvailabilityWindowRequest> windows) {
        if (windows == null || windows.isEmpty()) {
            return;
        }
        Timestamp now = Timestamp.from(Instant.now());
        for (AvailabilityWindowRequest w : windows) {
            jdbcTemplate.update("""
                    INSERT INTO availability_windows (resource_id, day_of_week, start_time, end_time, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    resourceId,
                    w.dayOfWeek(),
                    Time.valueOf(LocalTime.parse(w.startTime())),
                    Time.valueOf(LocalTime.parse(w.endTime())),
                    now);
        }
    }
}
