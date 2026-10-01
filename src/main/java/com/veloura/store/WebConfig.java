/* Connects Spring's browser-origin settings and admin request checks to the app. */
package com.veloura.store;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final AdminAccessInterceptor adminAccess;
    private final String allowedOrigin;

    public WebConfig(
        AdminAccessInterceptor adminAccess,
        @Value("${veloura.client-origin}") String allowedOrigin
    ) {
        this.adminAccess = adminAccess;
        this.allowedOrigin = allowedOrigin;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // CORS controls which other website may call our API from browser JavaScript.
        // This is different from logging in: admin requests still need a valid cookie.
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigin)
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowCredentials(true);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // An interceptor runs before controllers. See AdminAccessInterceptor for the checks.
        registry.addInterceptor(adminAccess);
    }
}
