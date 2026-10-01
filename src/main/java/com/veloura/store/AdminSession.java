/* Signs and verifies the same twelve-hour HttpOnly admin cookie as the old API. */
package com.veloura.store;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.GeneralSecurityException;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class AdminSession {
    private static final Duration SESSION_LENGTH = Duration.ofHours(12);
    private static final String COOKIE_NAME = "veloura_admin";
    private final String email;
    private final String password;
    private final String secret;
    private final boolean production;

    public AdminSession(@Value("${veloura.admin-email}") String email,
                        @Value("${veloura.admin-password}") String password,
                        @Value("${veloura.admin-secret}") String secret,
                        @Value("${veloura.production}") boolean production) {
        this.production = production;
        this.email = fallback(email, "admin@veloura.store", production);
        this.password = fallback(password, "veloura-admin", production);
        this.secret = fallback(secret, "veloura-dev-secret-change-me", production);
    }

    private static String fallback(String value, String demo, boolean production) {
        // Demo credentials are allowed locally, but never on a production shop.
        if (value.isBlank() && !production) {
            return demo;
        }
        return value;
    }

    public String email() {
        return email;
    }

    public String login(String suppliedEmail, String suppliedPassword) {
        if (email.isBlank() || password.isBlank() || secret.isBlank()) {
            throw new ApiException(503, "Admin access has not been configured on this environment.");
        }
        String emailToCheck = "";
        if (suppliedEmail != null) {
            emailToCheck = suppliedEmail.toLowerCase(Locale.ROOT);
        }
        String passwordToCheck = "";
        if (suppliedPassword != null) {
            passwordToCheck = suppliedPassword;
        }

        boolean emailMatches = equal(emailToCheck, email.toLowerCase(Locale.ROOT));
        boolean passwordMatches = equal(passwordToCheck, password);
        if (!emailMatches || !passwordMatches) {
            throw new ApiException(401, "Invalid email or password.");
        }
        long expiryTime = System.currentTimeMillis() + SESSION_LENGTH.toMillis();
        return token(expiryTime);
    }

    String token(long expiry) {
        // A token contains email | expiry time | signature.
        // Base64 makes it safe to store in a cookie. It does NOT encrypt the contents.
        String payload = email + "|" + expiry;
        String signature = sign(payload);
        String signedPayload = payload + "|" + signature;
        byte[] payloadBytes = signedPayload.getBytes(StandardCharsets.UTF_8);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payloadBytes);
    }

    public boolean valid(String token) {
        if (token == null || email.isBlank() || secret.isBlank()) {
            return false;
        }
        try {
            byte[] decodedBytes = Base64.getUrlDecoder().decode(token);
            String decodedToken = new String(decodedBytes, StandardCharsets.UTF_8);
            // -1 keeps empty fields so an incomplete token cannot look valid.
            String[] parts = decodedToken.split("\\|", -1);
            if (parts.length != 3) {
                return false;
            }
            String tokenEmail = parts[0];
            String tokenExpiry = parts[1];
            String tokenSignature = parts[2];

            if (!equal(tokenEmail, email)) {
                return false;
            }
            long expiryTime = Long.parseLong(tokenExpiry);
            if (expiryTime <= System.currentTimeMillis()) {
                return false;
            }
            String expectedSignature = sign(tokenEmail + "|" + tokenExpiry);
            return equal(tokenSignature, expectedSignature);
        } catch (IllegalArgumentException error) {
            return false;
        }
    }

    public boolean authenticated(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return false;
        }
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals(COOKIE_NAME) && valid(cookie.getValue())) {
                return true;
            }
        }
        return false;
    }

    public String cookie(String token) {
        Duration cookieLifetime = SESSION_LENGTH;
        if (token.isEmpty()) {
            // A zero lifetime tells the browser to delete the cookie when logging out.
            cookieLifetime = Duration.ZERO;
        }
        return ResponseCookie.from(COOKIE_NAME, token)
            .httpOnly(true)       // Browser JavaScript cannot read this login cookie.
            .secure(production)  // A production cookie is sent only over HTTPS.
            .sameSite("Lax")     // Limit when another website can send our cookie.
            .path("/")
            .maxAge(cookieLifetime)
            .build().toString();
    }

    private String sign(String payload) {
        try {
            // Keep this library algorithm: a normal hash is NOT a secure replacement.
            // Only a server with our secret can create the expected signature.
            byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
            byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec signingKey = new SecretKeySpec(secretBytes, "HmacSHA256");
            Mac signatureGenerator = Mac.getInstance("HmacSHA256");
            signatureGenerator.init(signingKey);
            byte[] signatureBytes = signatureGenerator.doFinal(payloadBytes);
            return HexFormat.of().formatHex(signatureBytes);
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("Session signing unavailable", error);
        }
    }

    private static boolean equal(String first, String second) {
        // Use the library's timing-resistant comparison for credentials and signatures.
        byte[] firstBytes = first.getBytes(StandardCharsets.UTF_8);
        byte[] secondBytes = second.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(firstBytes, secondBytes);
    }
}
