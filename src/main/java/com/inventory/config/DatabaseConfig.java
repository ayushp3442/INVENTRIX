package com.inventory.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String springUrl;

    @Value("${spring.datasource.username:}")
    private String springUser;

    @Value("${spring.datasource.password:}")
    private String springPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        // 1. Check for standard DATABASE_URL (Railway / Heroku / Render format: postgresql://user:pass@host:port/dbname)
        String envDbUrl = System.getenv("DATABASE_URL");
        if (envDbUrl == null || envDbUrl.isBlank()) {
            envDbUrl = System.getenv("SPRING_DATASOURCE_URL");
        }

        if (envDbUrl != null && !envDbUrl.isBlank()) {
            String trimmedUrl = envDbUrl.trim();
            log.info("[INVENTRIX] Detected database URL from environment variable");

            if (trimmedUrl.startsWith("postgres://") || trimmedUrl.startsWith("postgresql://")) {
                try {
                    // Convert protocol to http to allow standard java.net.URI parsing
                    String httpUrl = trimmedUrl.startsWith("postgres://")
                            ? "http://" + trimmedUrl.substring("postgres://".length())
                            : "http://" + trimmedUrl.substring("postgresql://".length());

                    URI uri = new URI(httpUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                    String path = uri.getPath();
                    String dbName = (path != null && path.length() > 1) ? path.substring(1) : "railway";

                    String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;
                    config.setJdbcUrl(jdbcUrl);
                    log.info("[INVENTRIX] Configured parsed JDBC URL: jdbc:postgresql://{}:{}/{}", host, port, dbName);

                    if (uri.getUserInfo() != null) {
                        String[] userInfo = uri.getUserInfo().split(":", 2);
                        config.setUsername(userInfo[0]);
                        if (userInfo.length > 1) {
                            config.setPassword(userInfo[1]);
                        }
                    }
                } catch (Exception e) {
                    log.warn("[INVENTRIX] Failed to parse URI, prepending jdbc:: {}", e.getMessage());
                    config.setJdbcUrl(trimmedUrl.startsWith("jdbc:") ? trimmedUrl : "jdbc:" + trimmedUrl);
                }
            } else {
                config.setJdbcUrl(trimmedUrl);
            }

            // Fallback for user/password if not extracted from URI
            if (config.getUsername() == null && springUser != null && !springUser.isBlank()) {
                config.setUsername(springUser);
            }
            if (config.getPassword() == null && springPassword != null) {
                config.setPassword(springPassword);
            }
        } else {
            // 2. Standard Spring properties / PGHOST / localhost fallback
            log.info("[INVENTRIX] Using datasource URL from properties: {}", springUrl);
            config.setJdbcUrl(springUrl);
            config.setUsername(springUser);
            config.setPassword(springPassword);
        }

        config.setDriverClassName("org.postgresql.Driver");
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setIdleTimeout(300000);
        config.setConnectionTimeout(20000);

        return new HikariDataSource(config);
    }
}