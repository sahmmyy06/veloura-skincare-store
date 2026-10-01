/* JUnit 5 checks signed-cookie authenticity, expiry, and production configuration. */
package com.veloura.store;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AdminSessionTest {
    private final AdminSession session = new AdminSession("", "", "", false);

    @Test
    void successfulLoginCreatesHttpOnlySession() {
        String token = session.login("ADMIN@VELOURA.STORE", "veloura-admin");
        assertTrue(session.valid(token));
        assertTrue(session.cookie(token).contains("HttpOnly"));
        assertTrue(session.cookie(token).contains("SameSite=Lax"));
        assertTrue(session.cookie("").contains("Max-Age=0"));
    }

    @Test
    void expiredMalformedAndTamperedTokensAreRejected() {
        assertFalse(session.valid(session.token(System.currentTimeMillis() - 1000)));
        assertFalse(session.valid("not-a-valid-token"));
        assertFalse(session.valid(null));
        AdminSession otherSecret = new AdminSession("", "", "another-secret", false);
        assertFalse(session.valid(otherSecret.token(System.currentTimeMillis() + 10000)));
    }

    @Test
    void productionNeverUsesDemoCredentials() {
        AdminSession production = new AdminSession("", "", "", true);
        ApiException error = assertThrows(ApiException.class,
            () -> production.login("admin@veloura.store", "veloura-admin"));
        assertEquals(503, error.status());
        assertFalse(production.valid(session.token(System.currentTimeMillis() + 10000)));
    }

    @Test
    void wrongCredentialsAreRejected() {
        assertEquals(401, assertThrows(ApiException.class,
            () -> session.login("admin@veloura.store", "wrong")).status());
    }
}
