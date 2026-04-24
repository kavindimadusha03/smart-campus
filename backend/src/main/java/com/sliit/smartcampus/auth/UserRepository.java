package com.sliit.smartcampus.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<User> ROW_MAPPER = (rs, rowNum) -> new User(
            rs.getLong("id"),
            rs.getString("email"),
            rs.getString("name"),
            rs.getString("profile_picture"),
            rs.getString("provider"),
            rs.getString("provider_id"),
            rs.getString("role"),
            rs.getBoolean("is_active"),
            rs.getTimestamp("created_at").toInstant(),
            rs.getTimestamp("updated_at").toInstant());

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<User> findByEmail(String email) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE email = ?",
                ROW_MAPPER, email);
        return users.stream().findFirst();
    }

    public Optional<User> findById(Long id) {
        List<User> users = jdbcTemplate.query(
                "SELECT * FROM users WHERE id = ?",
                ROW_MAPPER, id);
        return users.stream().findFirst();
    }

    public List<User> findAll() {
        return jdbcTemplate.query("SELECT * FROM users ORDER BY created_at DESC", ROW_MAPPER);
    }

    public User save(String email, String name, String profilePicture, String provider, String providerId) {
        Timestamp now = Timestamp.from(java.time.Instant.now());
        jdbcTemplate.update(
                """
                INSERT INTO users (email, name, profile_picture, provider, provider_id, role, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'USER', TRUE, ?, ?)
                """,
                email, name, profilePicture, provider, providerId, now, now);

        return findByEmail(email).orElseThrow();
    }

    public int updateRole(Long id, String role) {
        Timestamp now = Timestamp.from(java.time.Instant.now());
        return jdbcTemplate.update(
                "UPDATE users SET role = ?, updated_at = ? WHERE id = ?",
                role, now, id);
    }

    public int updateActiveStatus(Long id, boolean isActive) {
        Timestamp now = Timestamp.from(java.time.Instant.now());
        return jdbcTemplate.update(
                "UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?",
                isActive, now, id);
    }

    public int updateName(Long id, String name) {
        Timestamp now = Timestamp.from(java.time.Instant.now());
        return jdbcTemplate.update(
                "UPDATE users SET name = ?, updated_at = ? WHERE id = ?",
                name, now, id);
    }

    public int updateProfile(Long id, String name, String profilePicture) {
        Timestamp now = Timestamp.from(java.time.Instant.now());
        return jdbcTemplate.update(
                "UPDATE users SET name = ?, profile_picture = ?, updated_at = ? WHERE id = ?",
                name, profilePicture, now, id);
    }

    public List<User> findByRoles(List<String> roles) {
        String placeholders = String.join(",", roles.stream().map(r -> "?").toList());
        String sql = "SELECT * FROM users WHERE role IN (" + placeholders + ") AND is_active = TRUE";
        return jdbcTemplate.query(sql, ROW_MAPPER, roles.toArray());
    }
}
