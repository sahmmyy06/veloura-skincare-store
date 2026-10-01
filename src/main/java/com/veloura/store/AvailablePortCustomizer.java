/* Chooses the next free port before Tomcat starts, preserving other running servers. */
package com.veloura.store;

import java.io.IOException;
import java.net.BindException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

@Component
public class AvailablePortCustomizer
        implements WebServerFactoryCustomizer<TomcatServletWebServerFactory>, Ordered {
    private static final Logger LOG = LoggerFactory.getLogger(AvailablePortCustomizer.class);

    @Override
    public int getOrder() {
        // Run after Spring applies server.port, including environment and command-line overrides.
        return Ordered.LOWEST_PRECEDENCE;
    }

    @Override
    public void customize(TomcatServletWebServerFactory factory) {
        int requested = factory.getPort();
        if (requested <= 0) {
            // Port 0 asks the OS to choose a port; negative values disable the connector.
            return;
        }
        int available = findAvailablePort(requested, factory.getAddress());
        if (available != requested) {
            LOG.info("Port {} is in use. Starting Veloura on port {} instead.", requested, available);
            factory.setPort(available);
        }
    }

    static int findAvailablePort(int firstPort, InetAddress address) {
        if (firstPort < 1 || firstPort > 65535) {
            throw new IllegalArgumentException("Starting port must be between 1 and 65535.");
        }
        for (int port = firstPort; port <= 65535; port++) {
            // Opening a listening socket tests the port. The try block closes it afterwards.
            try (ServerSocket socket = new ServerSocket()) {
                socket.setReuseAddress(false);
                socket.bind(new InetSocketAddress(address, port));
                return port;
            } catch (BindException occupied) {
                // Check the next port without stopping whichever process owns this one.
            } catch (IOException error) {
                throw new IllegalStateException("Could not check port " + port, error);
            }
        }
        throw new IllegalStateException("No available port from " + firstPort + " through 65535.");
    }
}
