package com.sliit.smartcampus.config;

import com.sliit.smartcampus.auth.User;
import com.sliit.smartcampus.auth.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;

    public AdminBootstrap(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<User> users = userRepository.findAll();
        log.info("AdminBootstrap: found {} user(s) in database", users.size());

        boolean hasAdmin = users.stream().anyMatch(u -> "ADMIN".equals(u.role()));

        if (hasAdmin) {
            log.info("AdminBootstrap: ADMIN user already exists — skipping");
        } else if (!users.isEmpty()) {
            User first = users.get(users.size() - 1);
            userRepository.updateRole(first.id(), "ADMIN");
            log.info("AdminBootstrap: promoted '{}' ({}) to ADMIN", first.name(), first.email());
        } else {
            log.info("AdminBootstrap: no users yet — will promote first user on next restart");
        }
    }
}
