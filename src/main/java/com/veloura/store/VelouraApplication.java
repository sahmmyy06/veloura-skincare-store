/* Starts the Java API and creates the local database directory on a fresh clone. */
package com.veloura.store;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.server.PortInUseException;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;

@SpringBootApplication
public class VelouraApplication {
    private static final Logger LOG = LoggerFactory.getLogger(VelouraApplication.class);

    public static void main(String[] args) throws Exception {
        // SQLite needs its parent folder to exist before it can create the database file.
        Files.createDirectories(Path.of("server/data"));
        start(new SpringApplication(VelouraApplication.class), args);
    }

    static ConfigurableApplicationContext start(SpringApplication application, String... args) {
        // This holder lets the initializer read the updated port on every startup attempt.
        // -1 means "use the normal configured port"; a positive number means "retry here".
        AtomicInteger retryPort = new AtomicInteger(-1);
        application.addInitializers(context -> {
            if (retryPort.get() > 0) {
                // Highest priority also overrides a port supplied on the command line.
                context.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("port-retry", Map.of("server.port", retryPort.get())));
            }
        });
        while (true) {
            try {
                return application.run(args);
            } catch (RuntimeException failure) {
                int nextPort = nextPortAfter(failure);
                retryPort.set(nextPort);
                LOG.warn(
                    "Port {} became unavailable during startup. Retrying from port {}.",
                    nextPort - 1, nextPort);
                // Spring closes a failed context. A fresh run creates a new server and beans.
            }
        }
    }

    static int nextPortAfter(RuntimeException failure) {
        // Spring may wrap the real error in another error, so inspect each cause.
        Throwable cause = failure;
        while (cause != null) {
            if (cause instanceof PortInUseException) {
                PortInUseException portError = (PortInUseException) cause;
                int occupiedPort = portError.getPort();
                if (occupiedPort > 0 && occupiedPort < 65535) {
                    return occupiedPort + 1;
                }
            }
            cause = cause.getCause();
        }
        // Configuration/database failures must not be hidden by a port retry.
        throw failure;
    }
}
