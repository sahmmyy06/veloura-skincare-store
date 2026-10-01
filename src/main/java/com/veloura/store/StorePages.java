/* Renders the storefront and product pages as HTML on the Java server. */
package com.veloura.store;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class StorePages {
    // A controller chooses a page. CatalogService supplies that page's product data.
    private final CatalogService catalog;

    public StorePages(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/")
    String home(Model model) {
        // Model attributes are named values that Thymeleaf can read inside the HTML.
        model.addAttribute("activePage", "home");
        return "storefront";
    }

    @GetMapping("/shop")
    String shop(@RequestParam(defaultValue = "All") String category,
                @RequestParam(defaultValue = "") String search,
                @RequestParam(defaultValue = "1") int page, Model model) {
        // Step 1: find the products that match the submitted filters.
        boolean onlyBestsellers = false;
        boolean useAdminSortOrder = false;
        List<Map<String, Object>> products = catalog.list(
            category, search, onlyBestsellers, useAdminSortOrder);

        // Step 2: work out how many pages we need, including a partially filled last page.
        int productsPerPage = 6;
        int pageCount = products.size() / productsPerPage;
        if (products.size() % productsPerPage != 0) {
            pageCount++;
        }
        if (pageCount == 0) {
            pageCount = 1;
        }

        // Keep a manually typed page number inside the valid range.
        int currentPage = page;
        if (currentPage < 1) {
            currentPage = 1;
        }
        if (currentPage > pageCount) {
            currentPage = pageCount;
        }

        // List positions start at 0. subList includes the start, but excludes the end.
        int firstProductIndex = (currentPage - 1) * productsPerPage;
        int endProductIndex = Math.min(firstProductIndex + productsPerPage, products.size());
        List<Map<String, Object>> pageProducts = products.subList(
            firstProductIndex, endProductIndex);

        // Step 3: pass the page data to templates/shop.html.
        model.addAttribute("activePage", "shop");
        model.addAttribute("products", pageProducts);
        model.addAttribute("totalProducts", products.size());
        model.addAttribute("page", currentPage);
        model.addAttribute("pageCount", pageCount);
        model.addAttribute("category", category);
        model.addAttribute("search", search);
        model.addAttribute("categories", List.of("All", "Face Cream", "Body Cream",
            "Body Butter", "Hand Cream"));
        return "shop"; // Spring renders the HTML template named shop.html.
    }

    @GetMapping("/our-story")
    String story(Model model) {
        model.addAttribute("activePage", "story");
        return "story";
    }

    @GetMapping("/products/{id:[0-9]+}")
    String product(@PathVariable long id, Model model) {
        // Only numeric IDs match this route. Image paths such as /products/photo.webp do not.
        model.addAttribute("activePage", "shop");
        model.addAttribute("product", catalog.get(id));
        return "product";
    }

    @GetMapping("/checkout")
    String checkout() {
        return "checkout";
    }
}
