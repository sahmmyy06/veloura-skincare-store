/* Saves checkout atomically and keeps historical names and prices on order lines. */
package com.veloura.store;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {
    private final JdbcTemplate database;
    static final List<String> STATUSES = List.of(
        "pending", "confirmed", "shipped", "delivered", "cancelled");

    public OrderService(JdbcTemplate database) {
        this.database = database;
    }

    // A record is a small data container. Java creates its constructor and getters.
    // For example, checkout.email() reads the email sent by the browser.
    public record Checkout(
        String customerName,
        String email,
        String phone,
        String address,
        String city,
        String notes,
        List<CartItem> items
    ) {}

    public record CartItem(Long id, Object quantity) {}

    // These values come from the database, not from browser-supplied prices.
    private record ResolvedItem(long id, String name, long price, long quantity) {}

    @Transactional
    public Map<String, Object> create(Checkout checkout) {
        // A transaction is all-or-nothing: an error undoes every stock/order write here.
        // Step 1: check the customer details before changing stock.
        validateCheckout(checkout);

        long orderTotal = 0;
        List<ResolvedItem> checkedItems = new ArrayList<>();

        // Step 2: look up each product and reserve its stock.
        for (CartItem item : checkout.items()) {
            if (item == null || item.id() == null) {
                throw new ApiException(400, "One or more cart items are invalid.");
            }
            long quantity = CatalogService.wholeNumber(item.quantity(), "Quantity");
            List<Map<String, Object>> rows = database.queryForList(
                "SELECT * FROM products WHERE id = ?", item.id());
            if (rows.isEmpty() || quantity < 1) {
                throw new ApiException(400, "One or more cart items are invalid.");
            }
            Map<String, Object> product = rows.get(0);
            Number storedPrice = (Number) product.get("price");
            long price = storedPrice.longValue();

            // The stock check and deduction happen in the SAME database statement.
            // This also prevents repeated lines for one product from overselling it.
            int changedRowCount = database.update(
                "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                quantity, item.id(), quantity);
            if (changedRowCount == 0) {
                throw new ApiException(400,
                    product.get("name") + " only has " + product.get("stock") + " item(s) left.");
            }
            try {
                // Exact arithmetic rejects overflow instead of producing a wrong total.
                long itemTotal = Math.multiplyExact(price, quantity);
                orderTotal = Math.addExact(orderTotal, itemTotal);
            } catch (ArithmeticException error) {
                throw new ApiException(400, "Order total is too large.");
            }
            String productName = product.get("name").toString();
            checkedItems.add(new ResolvedItem(item.id(), productName, price, quantity));
        }

        // Step 3: save the order's customer details and trusted total.
        String orderNumber = "VEL-" + UUID.randomUUID().toString().toUpperCase(Locale.ROOT);
        String customerName = checkout.customerName().trim();
        String email = checkout.email().trim().toLowerCase(Locale.ROOT);
        String phone = checkout.phone().trim();
        String address = checkout.address().trim();
        String city = checkout.city().trim();
        String notes = "";
        if (checkout.notes() != null) {
            notes = checkout.notes().trim();
        }

        database.update("""
            INSERT INTO orders
                (order_number, customer_name, email, phone, address, city, notes, total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, orderNumber, customerName, email, phone, address, city, notes, orderTotal);
        long orderId = database.queryForObject("SELECT last_insert_rowid()", Long.class);

        // Step 4: save snapshots. Later product edits must not change an old receipt.
        for (ResolvedItem item : checkedItems) {
            database.update("""
                INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
                VALUES (?, ?, ?, ?, ?)
                """, orderId, item.id(), item.name(), item.price(), item.quantity());
        }

        // Step 5: the controller sends these named values back as JSON.
        return Map.of("orderNumber", orderNumber, "total", orderTotal, "status", "pending",
            "message", "Order created successfully.");
    }

    private static void validateCheckout(Checkout checkout) {
        String missingDetailsMessage =
            "Please complete the checkout form and add at least one product.";
        if (checkout == null) {
            throw new ApiException(400, missingDetailsMessage);
        }

        boolean missingName = blank(checkout.customerName());
        boolean missingEmail = blank(checkout.email());
        boolean missingPhone = blank(checkout.phone());
        boolean missingAddress = blank(checkout.address());
        boolean missingCity = blank(checkout.city());
        boolean emptyBag = checkout.items() == null || checkout.items().isEmpty();
        if (missingName || missingEmail || missingPhone || missingAddress || missingCity || emptyBag) {
            throw new ApiException(400, missingDetailsMessage);
        }

        // This pattern requires text before/after @ and a dot in the domain, with no spaces.
        if (!checkout.email().matches("^\\S+@\\S+\\.\\S+$")) {
            throw new ApiException(400, "Enter a valid email address.");
        }
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    public Map<String, Object> detail(Object identifier, boolean admin) {
        // Admin links use a numeric ID; customer links use the VEL-... reference.
        String lookupColumn = "order_number";
        String itemColumns = "product_id, product_name, price, quantity";
        if (admin) {
            lookupColumn = "id";
            itemColumns = "*";
        }
        String orderQuery = "SELECT * FROM orders WHERE " + lookupColumn + " = ?";
        List<Map<String, Object>> rows = database.queryForList(orderQuery, identifier);
        if (rows.isEmpty()) {
            throw new ApiException(404, "Order not found.");
        }
        Map<String, Object> order = new LinkedHashMap<>(rows.get(0));
        String itemQuery = "SELECT " + itemColumns
            + " FROM order_items WHERE order_id = ? ORDER BY id ASC";
        List<Map<String, Object>> items = database.queryForList(itemQuery, order.get("id"));
        order.put("items", items);
        return order;
    }

    public List<Map<String, Object>> list(String search, String status) {
        List<Object> queryValues = new ArrayList<>();
        List<String> conditions = new ArrayList<>();
        if (!blank(search)) {
            conditions.add("(order_number LIKE ? OR customer_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
            for (int index = 0; index < 4; index++) {
                // One search value for each of the four SQL question marks above.
                queryValues.add("%" + search.trim() + "%");
            }
        }
        if (!blank(status) && !status.equals("All")) {
            conditions.add("status = ?");
            queryValues.add(status.toLowerCase(Locale.ROOT));
        }
        String whereClause = "";
        if (!conditions.isEmpty()) {
            whereClause = " WHERE " + String.join(" AND ", conditions);
        }
        String query = "SELECT * FROM orders" + whereClause + " ORDER BY id DESC";
        return database.queryForList(query, queryValues.toArray());
    }

    @Transactional
    public Map<String, Object> changeStatus(long id, String status) {
        String requestedStatus = "";
        if (status != null) {
            requestedStatus = status.toLowerCase(Locale.ROOT);
        }
        if (!STATUSES.contains(requestedStatus)) {
            throw new ApiException(400, "Invalid order status.");
        }
        int changedRowCount = database.update(
            "UPDATE orders SET status = ? WHERE id = ?", requestedStatus, id);
        if (changedRowCount == 0) {
            throw new ApiException(404, "Order not found.");
        }
        return database.queryForMap("SELECT * FROM orders WHERE id = ?", id);
    }
}
