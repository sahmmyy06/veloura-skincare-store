/* Collects the catalogue and sales summaries used by both admin interfaces. */
package com.veloura.store;

import java.util.Map;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {
    private final JdbcTemplate database;

    public DashboardService(JdbcTemplate database) {
        this.database = database;
    }

    public Map<String, Object> summary() {
        // COUNT counts rows. SUM adds values. COALESCE uses 0 when there are no values.
        Map<String, Object> productSummary = database.queryForMap("""
                SELECT COUNT(*) AS total_products, COALESCE(SUM(stock), 0) AS total_units,
                    COALESCE(SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END), 0) AS low_stock
                FROM products
                """);

        Map<String, Object> orderSummary = database.queryForMap("""
                SELECT COUNT(*) AS total_orders, COALESCE(SUM(total), 0) AS revenue,
                    COUNT(DISTINCT email) AS customers,
                    COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending
                FROM orders
                """);

        List<Map<String, Object>> recentOrders = database.queryForList("""
                SELECT id, order_number, customer_name, total, status, created_at
                FROM orders ORDER BY id DESC LIMIT 6
                """);

        List<Map<String, Object>> lowStockProducts = database.queryForList("""
                SELECT id, name, category, stock, price, image FROM products
                WHERE stock <= 5 ORDER BY stock ASC, name ASC LIMIT 8
                """);

        // Both the HTML dashboard and the JSON API use these same four named results.
        return Map.of(
            "products", productSummary,
            "orders", orderSummary,
            "recentOrders", recentOrders,
            "lowStock", lowStockProducts);
    }
}
