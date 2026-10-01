/* Simulates repeated bind failures, including failures after the initial port probe. */
package com.veloura.store;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.net.ServerSocket;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.server.PortInUseException;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import static org.junit.jupiter.api.Assertions.*;

class ApplicationStartupTest {
    @Test
    void retriesMultipleActualBindFailuresAndOverridesTheOriginalPort() {
        ConflictingApplication application = new ConflictingApplication();
        try (ConfigurableApplicationContext context = VelouraApplication.start(application, "--server.port=4000")) {
            assertEquals(List.of(4000, 4001, 4002), application.attemptedPorts);
            assertEquals(4002, context.getEnvironment().getProperty("server.port", Integer.class));
        }
    }

    @Test
    void unrelatedFailuresAndAnExhaustedPortRangeAreNotRetried() {
        IllegalStateException databaseFailure = new IllegalStateException("Database failed");
        assertSame(databaseFailure, assertThrows(IllegalStateException.class,
            () -> VelouraApplication.nextPortAfter(databaseFailure)));
        PortInUseException exhausted = new PortInUseException(65535);
        assertSame(exhausted, assertThrows(PortInUseException.class,
            () -> VelouraApplication.nextPortAfter(exhausted)));
        assertThrows(PortInUseException.class,
            () -> VelouraApplication.nextPortAfter(new PortInUseException(0)));
    }

    @Test
    void realTomcatRetriesWhenTwoPortsAreTakenAfterTheAvailabilityCheck() throws Exception {
        int startingPort;
        try (ServerSocket freePort = new ServerSocket(0)) {
            startingPort = freePort.getLocalPort();
        }
        List<ServerSocket> blockers = new ArrayList<ServerSocket>();
        AtomicInteger attempts = new AtomicInteger();
        SpringApplication application = new SpringApplication(VelouraApplication.class);
        application.addInitializers(context -> {
            WebServerFactoryCustomizer<TomcatServletWebServerFactory> takeCheckedPort = factory -> {
                factory.addConnectorCustomizers(connector -> {
                    if (attempts.incrementAndGet() <= 2) {
                        try {
                            blockers.add(new ServerSocket(connector.getPort()));
                        } catch (IOException failure) {
                            throw new IllegalStateException("Could not create test port conflict", failure);
                        }
                    }
                });
            };
            context.getBeanFactory().registerSingleton("testPortConflict", takeCheckedPort);
        });
        try (ConfigurableApplicationContext context = VelouraApplication.start(application,
            "--server.port=" + startingPort,
            "--spring.datasource.url=jdbc:sqlite::memory:",
            "--veloura.production=false")) {
            ServletWebServerApplicationContext webContext = (ServletWebServerApplicationContext) context;
            assertEquals(3, attempts.get());
            assertTrue(webContext.getWebServer().getPort() >= startingPort + 2);
            java.net.http.HttpResponse<String> health = java.net.http.HttpClient.newHttpClient().send(
                java.net.http.HttpRequest.newBuilder(java.net.URI.create(
                    "http://localhost:" + webContext.getWebServer().getPort() + "/api/health"))
                    .GET().build(), java.net.http.HttpResponse.BodyHandlers.ofString());
            assertEquals(200, health.statusCode());
            assertTrue(health.body().contains("\"ok\":true"));
        } finally {
            for (ServerSocket blocker : blockers) {
                blocker.close();
            }
        }
    }

    private static class ConflictingApplication extends SpringApplication {
        private final List<Integer> attemptedPorts = new ArrayList<>();

        ConflictingApplication() {
            super(VelouraApplication.class);
            setInitializers(List.of());
        }

        @Override
        @SuppressWarnings("unchecked")
        public ConfigurableApplicationContext run(String... args) {
            GenericApplicationContext context = new GenericApplicationContext();
            context.getEnvironment().getPropertySources().addFirst(
                new MapPropertySource("original-command-line", Map.of("server.port", 4000)));
            for (ApplicationContextInitializer<?> initializer : getInitializers()) {
                ((ApplicationContextInitializer<ConfigurableApplicationContext>) initializer)
                    .initialize(context);
            }
            int port = context.getEnvironment().getProperty("server.port", Integer.class);
            attemptedPorts.add(port);
            if (attemptedPorts.size() <= 2) {
                context.close();
                throw new IllegalStateException("Server failed", new PortInUseException(port));
            }
            context.refresh();
            return context;
        }
    }
}
