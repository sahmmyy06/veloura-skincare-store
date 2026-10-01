/* SQLite reports constraint failures by error code, rather than standard SQL states. */
package com.veloura.store;

import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.SQLExceptionSubclassTranslator;

@Configuration
public class DatabaseConfig {
    @Bean
    JdbcTemplate jdbcTemplate(DataSource dataSource) {
        // @Bean tells Spring to share this database helper with our services.
        JdbcTemplate template = new JdbcTemplate(dataSource);
        SQLExceptionSubclassTranslator fallback = new SQLExceptionSubclassTranslator();
        // This callback runs when an SQL statement fails. SQLite uses code 19 for
        // constraints such as duplicate slugs; turn that into a recognizable Spring error.
        template.setExceptionTranslator((task, sql, error) -> {
            if (error.getErrorCode() == 19) {
                return new DataIntegrityViolationException("SQLite constraint violation", error);
            }
            return fallback.translate(task, sql, error);
        });
        return template;
    }
}
