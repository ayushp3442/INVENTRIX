package com.inventory.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    public CommandLineRunner initDatabase(DataSource dataSource) {
        return runnerArgs -> {
            try {
                System.out.println("--> [INVENTRIX] Executing schema.sql...");
                ResourceDatabasePopulator schemaPopulator = new ResourceDatabasePopulator();
                schemaPopulator.addScript(new ClassPathResource("schema.sql"));
                schemaPopulator.setContinueOnError(false);
                schemaPopulator.execute(dataSource);
                System.out.println("--> [INVENTRIX] schema.sql executed successfully!");

                System.out.println("--> [INVENTRIX] Executing data.sql...");
                ResourceDatabasePopulator dataPopulator = new ResourceDatabasePopulator();
                dataPopulator.addScript(new ClassPathResource("data.sql"));
                dataPopulator.setContinueOnError(true);
                dataPopulator.execute(dataSource);
                System.out.println("--> [INVENTRIX] Database schema and seed data initialized successfully!");
            } catch (Exception e) {
                System.err.println("--> [INVENTRIX ERROR] DB initialization failed: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }
}
