/* Owns catalogue reads, product validation, and safe product changes. */
package com.veloura.store;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService implements ApplicationRunner {
    // Spring gives this class a database helper and a JSON reader through its constructor.
    private final JdbcTemplate database;
    private final ObjectMapper jsonReader;
    // This order must match the column order in the INSERT and UPDATE statements below.
    private static final List<String> FIELDS = List.of("name", "slug", "category", "price",
        "description", "benefits", "image", "stock", "featured");

    public CatalogService(JdbcTemplate database, ObjectMapper jsonReader) {
        this.database = database;
        this.jsonReader = jsonReader;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        // ApplicationRunner means Spring calls this method after the app starts.
        int productCount = database.queryForObject("SELECT COUNT(*) FROM products", Integer.class);
        if (productCount != 0) {
            // Never replace an existing shop's products with the starter catalogue.
            return;
        }
        // try-with-resources closes the file automatically, including when reading fails.
        try (InputStream input = new ClassPathResource("products.json").getInputStream()) {
            // One map represents one product: a field name such as "price" and its value.
            List<Map<String, Object>> products = jsonReader.readValue(
                input, new TypeReference<List<Map<String, Object>>>() {});
            for (Map<String, Object> product : products) {
                insert(product);
            }
        }
    }

    public List<Map<String, Object>> list(String category, String search, boolean featured,
                                          boolean admin) {
        List<String> conditions = new ArrayList<>();
        List<Object> queryValues = new ArrayList<>();
        // A question mark is a placeholder. Values are passed separately, not pasted into SQL.
        if (category != null && !category.isBlank() && !category.equals("All")) {
            conditions.add("category = ?");
            queryValues.add(category);
        }
        if (search != null && !search.isBlank()) {
            conditions.add("(name LIKE ? OR description LIKE ?)");
            String searchPattern = "%" + search + "%";
            queryValues.add(searchPattern);
            queryValues.add(searchPattern);
        }
        if (featured) {
            conditions.add("featured = 1");
        }
        String whereClause = "";
        if (!conditions.isEmpty()) {
            whereClause = " WHERE " + String.join(" AND ", conditions);
        }

        String sortOrder = " ORDER BY featured DESC, id ASC";
        if (admin) {
            sortOrder = " ORDER BY id DESC";
        }

        String query = "SELECT * FROM products" + whereClause + sortOrder;
        return database.queryForList(query, queryValues.toArray());
    }

    public Map<String, Object> get(long id) {
        List<Map<String, Object>> rows = database.queryForList(
            "SELECT * FROM products WHERE id = ?", id);
        if (rows.isEmpty()) {
            throw new ApiException(404, "Product not found.");
        }
        return rows.get(0);
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        Map<String, Object> product = normalize(body, Map.of());
        insert(product);
        long newProductId = database.queryForObject("SELECT last_insert_rowid()", Long.class);
        return get(newProductId);
    }

    private void insert(Map<String, Object> product) {
        List<Object> columnValues = new ArrayList<>();
        for (String field : FIELDS) {
            columnValues.add(product.get(field));
        }
        database.update("""
            INSERT INTO products
                (name, slug, category, price, description, benefits, image, stock, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, columnValues.toArray());
    }

    @Transactional
    public Map<String, Object> update(long id, Map<String, Object> body) {
        Map<String, Object> existingProduct = get(id);
        Map<String, Object> updatedProduct = normalize(body, existingProduct);
        List<Object> columnValues = new ArrayList<>();
        for (String field : FIELDS) {
            columnValues.add(updatedProduct.get(field));
        }
        // The final placeholder is the product ID in WHERE id = ?.
        columnValues.add(id);
        database.update("""
            UPDATE products SET name = ?, slug = ?, category = ?, price = ?, description = ?,
                benefits = ?, image = ?, stock = ?, featured = ? WHERE id = ?
            """, columnValues.toArray());
        return get(id);
    }

    @Transactional
    public void delete(long id) {
        int linkedOrderCount = database.queryForObject(
            "SELECT COUNT(*) FROM order_items WHERE product_id = ?", Integer.class, id);
        if (linkedOrderCount > 0) {
            throw new ApiException(409,
                "This product belongs to an existing order and cannot be deleted. Set stock to 0 instead.");
        }
        database.update("DELETE FROM products WHERE id = ?", id);
    }

    static Map<String, Object> normalize(Map<String, Object> body, Map<String, Object> existing) {
        // Start with saved values so an edit may change just one field.
        Map<String, Object> product = new LinkedHashMap<>(existing);
        for (Map.Entry<String, Object> field : body.entrySet()) {
            Object value = field.getValue();
            if (value != null) {
                product.put(field.getKey(), value);
            }
        }
        for (String field : List.of("name", "category", "description", "benefits")) {
            String value = String.valueOf(product.getOrDefault(field, "")).trim();
            if (value.isEmpty()) {
                throw new ApiException(400, "Name, category, description and benefits are required.");
            }
            product.put(field, value);
        }
        Object suppliedSlug = body.get("slug");
        // A slug is a URL-friendly name: "Rose Dew" becomes "rose-dew".
        String slugSource = product.get("name").toString();
        if (suppliedSlug != null && !suppliedSlug.toString().isBlank()) {
            slugSource = suppliedSlug.toString();
        }
        String slug = slugSource.toLowerCase(Locale.ROOT).trim();
        slug = slug.replaceAll("[^a-z0-9]+", "-");
        slug = slug.replaceAll("^-|-$", "");
        if (slug.isEmpty()) {
            throw new ApiException(400, "A valid product slug is required.");
        }
        product.put("slug", slug);
        product.put("price", wholeNumber(product.getOrDefault("price", 0), "Price"));
        product.put("stock", wholeNumber(product.getOrDefault("stock", 0), "Stock"));
        Object featured = product.getOrDefault("featured", 0);
        int featuredFlag = 0;
        if (Boolean.TRUE.equals(featured) || "1".equals(featured.toString())) {
            featuredFlag = 1;
        }
        product.put("featured", featuredFlag);
        String image = String.valueOf(product.getOrDefault("image", "")).trim();
        if (image.isEmpty()) {
            image = "/products/placeholder.svg";
        }
        product.put("image", image);
        return product;
    }

    static long wholeNumber(Object value, String field) {
        try {
            // longValueExact rejects fractions and values too large for a Java long.
            BigDecimal number = new BigDecimal(String.valueOf(value));
            long result = number.longValueExact();
            if (result >= 0) {
                return result;
            }
        } catch (NumberFormatException | ArithmeticException ignored) {
            // Invalid user input becomes a business error rather than a server failure.
        }
        throw new ApiException(400, field + " must be a whole number of 0 or more.");
    }
}
