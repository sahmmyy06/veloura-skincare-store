/* Exercises real HTTP handlers, Thymeleaf templates, and isolated SQLite transactions. */
package com.veloura.store;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.InputStream;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "veloura.production=false",
    "veloura.admin-email=admin@veloura.store",
    "veloura.admin-password=veloura-admin",
    "veloura.admin-secret=test-only-secret"
})
@AutoConfigureMockMvc
class StoreIntegrationTest {
    // These tests use real Spring handlers and an isolated database, not mocks.
    @Autowired
    MockMvc requests;
    @Autowired
    JdbcTemplate database;
    @Autowired
    ObjectMapper json;
    @Autowired
    AdminSession session;
    @Autowired
    CatalogService catalog;

    @BeforeEach
    void resetOrders() {
        database.update("DELETE FROM order_items");
        database.update("DELETE FROM orders");
        database.update("UPDATE products SET stock = 18 WHERE id = 1");
        database.update("UPDATE products SET stock = 24 WHERE id = 2");
    }

    private Cookie admin() {
        return new Cookie("veloura_admin", session.login("admin@veloura.store", "veloura-admin"));
    }

    private String checkout(List<Map<String, Object>> items) throws Exception {
        return json.writeValueAsString(Map.of("customerName", "Ada Example",
            "email", "Ada@Example.com", "phone", "08012345678", "address", "10 Rose Street",
            "city", "Lagos", "items", items));
    }

    @Test
    void healthSeedCatalogueAndSearchWork() throws Exception {
        requests.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.ok").value(true));
        requests.perform(get("/api/products"))
            .andExpect(status().isOk())
            
            .andExpect(jsonPath("$", hasSize(20)))
            .andExpect(jsonPath("$[0].featured").value(1));
        requests.perform(get("/api/products").param("search", "Rose Dew").param("category", "Face Cream"))
            
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(2));
        requests.perform(get("/api/products/99999"))
            .andExpect(status().isNotFound());
        requests.perform(get("/missing.css"))
            .andExpect(status().isNotFound());
        requests.perform(get("/api/og-image.png"))
            .andExpect(status().isOk())
            
            .andExpect(content().contentType("image/png"));
        requests.perform(get("/products/placeholder.svg"))
            .andExpect(status().isOk())
            
            .andExpect(content().contentTypeCompatibleWith("image/svg+xml"));
    }

    @Test
    void generatedBrandAndCatalogueImagesAreServed() throws Exception {
        for (String image : List.of("veloura-icon.png", "favicon-32.png",
                "icon-192.png", "apple-touch-icon.png")) {
            requests.perform(get("/brand/" + image))
            .andExpect(status().isOk())
                
            .andExpect(content().contentTypeCompatibleWith("image/png"));
        }
        for (String image : List.of("veloura-skincare-hero.webp", "veloura-story-still-life.webp")) {
            requests.perform(get("/images/" + image))
            .andExpect(status().isOk())
                
            .andExpect(content().contentTypeCompatibleWith("image/webp"));
        }
        requests.perform(get("/images/veloura-social.png"))
            .andExpect(status().isOk())
            
            .andExpect(content().contentTypeCompatibleWith("image/png"));
        // Read the original catalogue, not products that another CRUD test may have edited.
        try (InputStream input = new ClassPathResource("products.json").getInputStream()) {
            JsonNode products = json.readTree(input);
            assertEquals(20, products.size());
            for (JsonNode product : products) {
                requests.perform(get(product.get("image").asText()))
            .andExpect(status().isOk())
                    
            .andExpect(content().contentTypeCompatibleWith("image/webp"));
            }
        }
    }

    @Test
    void adminGuardLoginAndLogoutWork() throws Exception {
        requests.perform(get("/api/admin/dashboard"))
            .andExpect(status().isUnauthorized());
        requests.perform(get("/admin"))
            .andExpect(status().is3xxRedirection())
            
            .andExpect(redirectedUrl("/admin/login"));
        requests.perform(post("/api/admin/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@veloura.store\",\"password\":\"veloura-admin\"}"))
            
            .andExpect(status().isOk())
            .andExpect(header().string("Set-Cookie", containsString("HttpOnly")));
        requests.perform(get("/api/admin/me").cookie(admin()))
            
            .andExpect(jsonPath("$.authenticated").value(true));
        requests.perform(post("/api/admin/logout"))
            
            .andExpect(header().string("Set-Cookie", containsString("Max-Age=0")));
        requests.perform(post("/api/admin/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@veloura.store\",\"password\":\"wrong\"}"))
            
            .andExpect(status().isUnauthorized());
        requests.perform(post("/api/admin/logout").header("Origin", "https://evil.example"))
            
            .andExpect(status().isForbidden());
    }

    @Test
    void adminWritesKeepOriginProtectionAndAuthenticatedReadsAreNotCached() throws Exception {
        // Arrange: valid credentials, then vary only the browser's Origin header.
        String credentials = json.writeValueAsString(Map.of(
            "email", "admin@veloura.store",
            "password", "veloura-admin"
        ));

        // Act and assert: same-server and configured frontend origins may log in.
        for (String origin : List.of("http://localhost", "http://localhost:5173")) {
            requests.perform(post("/api/admin/login")
                    .header("Origin", origin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(credentials))
                .andExpect(status().isOk());
        }

        // Spring's CORS layer may reject these before our interceptor runs.
        // Either way, a different host, port, scheme, or malformed origin is forbidden.
        for (String origin : List.of("https://evil.example", "http://localhost:9999",
                "https://localhost", "null")) {
            requests.perform(post("/api/admin/login")
                    .header("Origin", origin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(credentials))
                .andExpect(status().isForbidden());
        }

        requests.perform(get("/api/admin/dashboard").cookie(admin()))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"))
            .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @Test
    void shopPaginationClampsOutOfRangePagesAndHandlesNoResults() throws Exception {
        // A bad page number should still produce a usable page, not an index error.
        requests.perform(get("/shop").param("page", "-5"))
            .andExpect(status().isOk())
            .andExpect(model().attribute("page", 1))
            .andExpect(model().attribute("products", hasSize(6)));
        requests.perform(get("/shop").param("page", "99999"))
            .andExpect(status().isOk())
            .andExpect(model().attribute("page", 4))
            .andExpect(model().attribute("products", hasSize(2)));
        requests.perform(get("/shop").param("search", "no-match-123").param("page", "9"))
            .andExpect(status().isOk())
            .andExpect(model().attribute("page", 1))
            .andExpect(model().attribute("pageCount", 1))
            .andExpect(model().attribute("products", hasSize(0)));
    }

    @Test
    void checkoutUsesDatabasePriceAndStoresSnapshots() throws Exception {
        MvcResult result = requests.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                .content(checkout(List.of(Map.of("id", 1, "quantity", 2, "price", 1)))))
            
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.total").value(37000))
            
            .andReturn();
        String number = json.readTree(result.getResponse().getContentAsString()).get("orderNumber").asText();
        assertEquals(16, database.queryForObject("SELECT stock FROM products WHERE id = 1", Integer.class));
        requests.perform(get("/api/orders/" + number))
            .andExpect(status().isOk())
            
            .andExpect(jsonPath("$.email").value("ada@example.com"))
            
            .andExpect(jsonPath("$.items[0].price").value(18500));
        requests.perform(get("/api/admin/dashboard").cookie(admin()))
            
            .andExpect(jsonPath("$.orders.revenue").value(37000))
            
            .andExpect(jsonPath("$.orders.customers").value(1));
        requests.perform(delete("/api/admin/products/1").cookie(admin()))
            .andExpect(status().isConflict());
    }

    @Test
    void stockFailuresAndDuplicateCartLinesRollBackEverything() throws Exception {
        requests.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                .content(checkout(List.of(Map.of("id", 2, "quantity", 1), Map.of("id", 1, "quantity", 19)))))
            
            .andExpect(status().isBadRequest());
        assertEquals(24, database.queryForObject("SELECT stock FROM products WHERE id = 2", Integer.class));
        requests.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
                .content(checkout(List.of(Map.of("id", 1, "quantity", 10), Map.of("id", 1, "quantity", 10)))))
            
            .andExpect(status().isBadRequest());
        assertEquals(18, database.queryForObject("SELECT stock FROM products WHERE id = 1", Integer.class));
        assertEquals(0, database.queryForObject("SELECT COUNT(*) FROM orders", Integer.class));
        assertEquals(0, database.queryForObject("SELECT COUNT(*) FROM order_items", Integer.class));
    }

    @Test
    void invalidCheckoutAndStatusAreRejected() throws Exception {
        String valid = checkout(List.of(Map.of("id", 1, "quantity", 1)));
        requests.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
            .content(valid.replace("Ada@Example.com", "invalid")))
            .andExpect(status().isBadRequest());
        requests.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
            .content(checkout(List.of(Map.of("id", 1, "quantity", 1.5)))))
            
            .andExpect(status().isBadRequest());
        requests.perform(patch("/api/admin/orders/1/status").cookie(admin())
            .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"unknown\"}"))
            
            .andExpect(status().isBadRequest());
    }

    @Test
    void productCrudAndPartialUpdatesWork() throws Exception {
        Map<String, Object> body = Map.of("name", "Test Cream", "category", "Face Cream", "price", 1000,
            "stock", 5, "description", "A test cream", "benefits", "Moisture", "featured", 1);
        MvcResult result = requests.perform(post("/api/admin/products").cookie(admin())
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
            
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.slug").value("test-cream"))
            .andReturn();
        long id = json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
        try {
            requests.perform(put("/api/admin/products/" + id).cookie(admin())
                .contentType(MediaType.APPLICATION_JSON).content("{\"stock\":7}"))
                
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.featured").value(1))
                
            .andExpect(jsonPath("$.stock").value(7));
            requests.perform(post("/api/admin/products").cookie(admin())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                
            .andExpect(status().isBadRequest());
        } finally {
            catalog.delete(id);
        }
    }

    @Test
    void javaHtmlPagesAndAdminFormsRenderAndSubmit() throws Exception {
        requests.perform(get("/"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith("text/html"))
            
            .andExpect(content().string(containsString("Shop the collection")))
            
            .andExpect(content().string(not(containsString("class=\"product-grid\""))))
            
            .andExpect(content().string(not(containsString("/src/main.jsx"))));
        requests.perform(get("/shop"))
            .andExpect(status().isOk())
            
            .andExpect(model().attribute("totalProducts", 20))
            
            .andExpect(model().attribute("pageCount", 4))
            
            .andExpect(model().attribute("products", hasSize(6)))
            
            .andExpect(content().string(containsString("Radiance Glow Body Cream")));
        requests.perform(get("/shop").param("page", "4"))
            
            .andExpect(model().attribute("products", hasSize(2)));
        requests.perform(get("/shop").param("search", "no-match-123"))
            
            .andExpect(content().string(containsString("No products match")));
        requests.perform(get("/our-story"))
            .andExpect(status().isOk());
        requests.perform(get("/products/1"))
            .andExpect(status().isOk());
        requests.perform(get("/checkout"))
            .andExpect(status().isOk());
        requests.perform(get("/admin/login"))
            .andExpect(status().isOk());
        requests.perform(post("/admin/login").param("email", "admin@veloura.store")
            .param("password", "veloura-admin"))
            .andExpect(redirectedUrl("/admin"));
        for (String path : List.of("/admin", "/admin/products", "/admin/inventory",
            "/admin/products/new", "/admin/products/1/edit", "/admin/orders")) {
            requests.perform(get(path).cookie(admin()))
            .andExpect(status().isOk());
        }
        requests.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON)
            .content(checkout(List.of(Map.of("id", 1, "quantity", 1)))))
            
            .andExpect(status().isCreated());
        long id = database.queryForObject("SELECT id FROM orders", Long.class);
        requests.perform(get("/admin/orders/" + id).cookie(admin()))
            .andExpect(status().isOk())
            
            .andExpect(content().string(containsString("Ada Example")));
        requests.perform(post("/admin/orders/" + id + "/status").cookie(admin()).param("status", "shipped"))
            
            .andExpect(redirectedUrl("/admin/orders/" + id))
            
            .andExpect(flash().attribute("success", "Order status updated successfully."));
        assertEquals("shipped", database.queryForObject("SELECT status FROM orders", String.class));
        requests.perform(post("/admin/products/save").cookie(admin()).param("id", "1")
            .param("name", "Radiance Glow Body Cream").param("slug", "radiance-glow-body-cream")
            .param("category", "Body Cream").param("price", "18500").param("stock", "18")
            .param("description", "A rich daily moisturizer").param("benefits", "Shea butter")
            .param("featured", "1"))
            .andExpect(redirectedUrl("/admin/products"))
            
            .andExpect(flash().attribute("success", "Product saved successfully."));
    }
}
