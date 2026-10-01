/* Real occupied sockets reproduce port conflicts without touching existing processes. */
package com.veloura.store;

import java.net.ServerSocket;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import static org.junit.jupiter.api.Assertions.*;

class AvailablePortCustomizerTest {
    @Test
    void occupiedPortMovesToTheNextAvailablePort() throws Exception {
        try (ServerSocket occupied = new ServerSocket(0)) {
            int firstPort = occupied.getLocalPort();
            TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory(firstPort);
            new AvailablePortCustomizer().customize(factory);
            assertTrue(factory.getPort() > firstPort);
            try (ServerSocket selected = new ServerSocket(factory.getPort())) {
                assertEquals(factory.getPort(), selected.getLocalPort());
            }
            assertFalse(occupied.isClosed());
        }
    }

    @Test
    void availablePortIsKeptAndZeroStillRequestsAnOsAssignedPort() throws Exception {
        int port;
        try (ServerSocket temporary = new ServerSocket(0)) {
            port = temporary.getLocalPort();
        }
        assertEquals(port, AvailablePortCustomizer.findAvailablePort(port, null));
        TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory(0);
        new AvailablePortCustomizer().customize(factory);
        assertEquals(0, factory.getPort());
    }

    @Test
    void invalidStartingPortsAreRejected() {
        assertThrows(IllegalArgumentException.class,
            () -> AvailablePortCustomizer.findAvailablePort(65536, null));
        assertThrows(IllegalArgumentException.class,
            () -> AvailablePortCustomizer.findAvailablePort(-1, null));
    }
}
