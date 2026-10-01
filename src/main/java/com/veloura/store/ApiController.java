/* Preserves public and admin API URLs while Java services own the business rules. */
package com.veloura.store;

import java.util.Map;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ApiController {
    // @RestController sends return values as JSON rather than rendering an HTML template.
    // @RequestMapping makes every route below start with /api.
    private final CatalogService catalog;
    private final OrderService orders;
    private final AdminSession session;
    private final DashboardService dashboard;

    public ApiController(CatalogService catalog, OrderService orders, AdminSession session,
                         DashboardService dashboard) {
        this.catalog = catalog;
        this.orders = orders;
        this.session = session;
        this.dashboard = dashboard;
    }

    @GetMapping("/health")
    Map<String, Object> health() {
        return Map.of("ok", true, "service", "veloura-api");
    }

    @GetMapping({"/products", "/admin/products"})
    List<Map<String, Object>> products(@RequestParam(required = false) String category,
                    @RequestParam(required = false) String search,
                    @RequestParam(defaultValue = "false") boolean featured,
                    HttpServletRequest request) {
        // One handler serves both catalogues; admin results have newest products first.
        boolean isAdminRequest = request.getRequestURI().contains("/admin/");
        return catalog.list(category, search, featured, isAdminRequest);
    }

    @GetMapping("/products/{id}")
    Map<String, Object> product(@PathVariable long id) {
        return catalog.get(id);
    }

    @PostMapping("/orders")
    ResponseEntity<Map<String, Object>> checkout(@RequestBody OrderService.Checkout checkout) {
        // @RequestBody reads the JSON sent by the browser into the Checkout record.
        Map<String, Object> createdOrder = orders.create(checkout);
        return ResponseEntity.status(201).body(createdOrder); // 201 means "created".
    }

    @GetMapping("/orders/{number}")
    Map<String, Object> order(@PathVariable String number) {
        return orders.detail(number, false);
    }

    @PostMapping("/admin/login")
    ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String token = session.login(body.get("email"), body.get("password"));
        String loginCookie = session.cookie(token);
        Map<String, Object> result = Map.of("ok", true, "email", session.email());
        return ResponseEntity.ok()
            .header("Set-Cookie", loginCookie)
            .body(result);
    }

    @PostMapping("/admin/logout")
    ResponseEntity<Map<String, Boolean>> logout() {
        String expiredCookie = session.cookie("");
        return ResponseEntity.ok()
            .header("Set-Cookie", expiredCookie)
            .body(Map.of("ok", true));
    }

    @GetMapping("/admin/me")
    Map<String, Object> me() {
        return Map.of("authenticated", true, "email", session.email());
    }

    @GetMapping("/admin/dashboard")
    Map<String, Object> dashboard() {
        return dashboard.summary();
    }

    @PostMapping("/admin/products")
    ResponseEntity<Map<String, Object>> createProduct(@RequestBody Map<String, Object> body) {
        Map<String, Object> createdProduct = catalog.create(body);
        return ResponseEntity.status(201).body(createdProduct);
    }

    @PutMapping("/admin/products/{id}")
    Map<String, Object> editProduct(@PathVariable long id, @RequestBody Map<String, Object> body) {
        return catalog.update(id, body);
    }

    @DeleteMapping("/admin/products/{id}")
    Map<String, Boolean> deleteProduct(@PathVariable long id) {
        catalog.delete(id);
        return Map.of("ok", true);
    }

    @GetMapping("/admin/orders")
    List<Map<String, Object>> adminOrders(@RequestParam(required = false) String search,
                       @RequestParam(required = false) String status) {
        return orders.list(search, status);
    }

    @GetMapping("/admin/orders/{id}")
    Map<String, Object> adminOrder(@PathVariable long id) {
        return orders.detail(id, true);
    }

    @PatchMapping("/admin/orders/{id}/status")
    Map<String, Object> orderStatus(@PathVariable long id, @RequestBody Map<String, String> body) {
        return orders.changeStatus(id, body.get("status"));
    }
}
