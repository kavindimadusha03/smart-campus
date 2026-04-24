package com.sliit.smartcampus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
public class SmartcampusApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(SmartcampusApplication.class, args);
	}

	/** Load .env into system properties so ${VAR} in application.properties resolve. */
	private static void loadEnv() {
		for (Path dir : new Path[] { Path.of("").toAbsolutePath(), Path.of("backend").toAbsolutePath() }) {
			Path env = dir.resolve(".env");
			if (Files.isRegularFile(env)) {
				try {
					Map<String, String> vars = new HashMap<>();
					for (String line : Files.readAllLines(env)) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) continue;
						int eq = line.indexOf('=');
						if (eq <= 0) continue;
						String key = line.substring(0, eq).trim();
						String value = line.substring(eq + 1).trim();
						if (value.startsWith("\"") && value.endsWith("\"")) value = value.substring(1, value.length() - 1);
						if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length() - 1);
						if (System.getProperty(key) == null) vars.put(key, value);
					}
					vars.forEach(System::setProperty);
				} catch (Exception e) {
					// ignore
				}
				break;
			}
		}
	}
}
