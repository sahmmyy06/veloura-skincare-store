/* Checks admin requests before a controller runs; keeps login and origin checks in one place. */
package com.veloura.store;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AdminAccessInterceptor implements HandlerInterceptor {
    private final AdminSession session;
    private final ObjectMapper jsonWriter;
    private final String allowedOrigin;

    public AdminAccessInterceptor(
        AdminSession session,
        ObjectMapper jsonWriter,
        @Value("${veloura.client-origin}") String allowedOrigin
    ) {
        this.session = session;
        this.jsonWriter = jsonWriter;
        this.allowedOrigin = allowedOrigin;
    }

    @Override
    public boolean preHandle(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler
    ) throws Exception {
        // true means "let the request reach its controller". false means "stop here".
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        String path = request.getRequestURI();
        String method = request.getMethod();
        boolean isAdminPath = path.startsWith("/api/admin/") || path.startsWith("/admin");
        if (!isAdminPath || method.equals("OPTIONS")) {
            // OPTIONS is the browser's permission check before a cross-origin API request.
            return true;
        }

        // Check writes before checking login, including writes to the login/logout routes.
        // Cookies alone must not let another website submit an admin change.
        boolean isReadRequest = method.equals("GET") || method.equals("HEAD");
        if (!isReadRequest) {
            String requestOrigin = request.getHeader("Origin");
            if (requestOrigin != null) {
                boolean matchesConfiguredOrigin = requestOrigin.equals(allowedOrigin);
                boolean matchesThisServer = sameHost(requestOrigin, request);
                if (!matchesConfiguredOrigin && !matchesThisServer) {
                    sendJsonError(response, 403, "Invalid request origin.");
                    return false;
                }
            }
        }

        // A visitor must be able to reach login without already having a login cookie.
        boolean isLoginOrApiLogout = path.equals("/api/admin/login")
            || path.equals("/api/admin/logout") || path.equals("/admin/login");
        if (isLoginOrApiLogout) {
            return true;
        }

        if (session.authenticated(request)) {
            response.setHeader("Cache-Control", "no-store");
            return true;
        }

        // API callers need a JSON error. A person visiting an HTML page needs the login page.
        if (path.startsWith("/api/")) {
            sendJsonError(response, 401, "Admin authentication required.");
        } else {
            response.sendRedirect("/admin/login");
        }
        return false;
    }

    private void sendJsonError(HttpServletResponse response, int status, String message)
        throws Exception {
        response.setStatus(status);
        response.setContentType("application/json");
        jsonWriter.writeValue(response.getWriter(), Map.of("message", message));
    }

    private static boolean sameHost(String origin, HttpServletRequest request) {
        try {
            URI originAddress = URI.create(origin);
            String scheme = originAddress.getScheme();
            String host = originAddress.getHost();
            if (scheme == null || host == null) {
                return false;
            }

            int port = originAddress.getPort();
            if (port == -1) {
                // URLs may omit the usual port: HTTP uses 80 and HTTPS uses 443.
                port = 80;
                if (scheme.equals("https")) {
                    port = 443;
                }
            }

            boolean sameScheme = scheme.equals(request.getScheme());
            boolean sameHostname = host.equals(request.getServerName());
            boolean samePort = port == request.getServerPort();
            return sameScheme && sameHostname && samePort;
        } catch (IllegalArgumentException error) {
            return false;
        }
    }
}
