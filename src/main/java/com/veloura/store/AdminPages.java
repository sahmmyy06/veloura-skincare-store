/* Admin HTML forms call the same services as the JSON API. */
package com.veloura.store;

import jakarta.servlet.http.HttpServletResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin")
public class AdminPages {
    // These services do the work. This controller only prepares pages and handles forms.
    private final AdminSession session;
    private final CatalogService catalog;
    private final OrderService orders;
    private final DashboardService dashboard;

    public AdminPages(AdminSession session, CatalogService catalog, OrderService orders,
                      DashboardService dashboard) {
        this.session = session;
        this.catalog = catalog;
        this.orders = orders;
        this.dashboard = dashboard;
    }

    @GetMapping("/login")
    String loginPage() {
        return "admin/login";
    }

    @PostMapping("/login")
    String login(@RequestParam String email, @RequestParam String password,
                 HttpServletResponse response, Model model, RedirectAttributes flash) {
        try {
            String loginToken = session.login(email, password);
            String loginCookie = session.cookie(loginToken);
            response.addHeader("Set-Cookie", loginCookie);
            // A flash message survives the redirect and is shown once on the next page.
            flash.addFlashAttribute("success", "Welcome back. You are signed in.");
            return "redirect:/admin";
        } catch (ApiException error) {
            response.setStatus(error.status());
            model.addAttribute("error", error.getMessage());
            return "admin/login";
        }
    }

    @PostMapping("/logout")
    String logout(HttpServletResponse response, RedirectAttributes flash) {
        response.addHeader("Set-Cookie", session.cookie(""));
        flash.addFlashAttribute("success", "You have been signed out.");
        return "redirect:/admin/login";
    }

    @GetMapping({"", "/"})
    String dashboard(Model model) {
        model.addAttribute("summary", dashboard.summary());
        return "admin/dashboard";
    }

    @GetMapping({"/products", "/inventory"})
    String products(@RequestParam(defaultValue = "") String search, Model model) {
        model.addAttribute("products", catalog.list(null, search, false, true));
        model.addAttribute("search", search);
        return "admin/products";
    }

    @GetMapping("/products/new")
    String newProduct(Model model) {
        // The same form handles new and existing products. A null ID means "new".
        Map<String, Object> product = new LinkedHashMap<>();
        product.put("id", null);
        product.put("name", "");
        product.put("slug", "");
        product.put("category", "");
        product.put("description", "");
        product.put("benefits", "");
        product.put("image", "");
        product.put("stock", 0);
        product.put("price", 0);
        product.put("featured", 0);
        model.addAttribute("product", product);
        return "admin/product-form";
    }

    @GetMapping("/products/{id}/edit")
    String edit(@PathVariable long id, Model model) {
        model.addAttribute("product", catalog.get(id));
        return "admin/product-form";
    }

    @PostMapping("/products/save")
    String save(@RequestParam Map<String, String> form, Model model,
                HttpServletResponse response, RedirectAttributes flash) {
        // HTML form values are strings. The catalogue service checks and converts them.
        Map<String, Object> body = new LinkedHashMap<>(form);
        // Browsers omit unchecked checkboxes, so absence must mean "not featured".
        body.put("featured", form.getOrDefault("featured", "0"));
        try {
            if (form.getOrDefault("id", "").isBlank()) {
                catalog.create(body);
            } else {
                long productId = Long.parseLong(form.get("id"));
                catalog.update(productId, body);
            }
            flash.addFlashAttribute("success", "Product saved successfully.");
            return "redirect:/admin/products";
        } catch (ApiException | DataIntegrityViolationException error) {
            response.setStatus(400);
            model.addAttribute("product", body);
            String errorMessage = "A product with this slug already exists.";
            if (error instanceof ApiException) {
                errorMessage = error.getMessage();
            }
            model.addAttribute("error", errorMessage);
            // Show the submitted values again so the admin does not have to retype them.
            return "admin/product-form";
        }
    }

    @PostMapping("/products/{id}/delete")
    String delete(@PathVariable long id, RedirectAttributes flash) {
        try {
            catalog.delete(id);
            flash.addFlashAttribute("success", "Product deleted successfully.");
        } catch (ApiException error) {
            flash.addFlashAttribute("error", error.getMessage());
        }
        return "redirect:/admin/products";
    }

    @GetMapping("/orders")
    String orders(@RequestParam(defaultValue = "") String search,
                  @RequestParam(defaultValue = "All") String status, Model model) {
        model.addAttribute("orders", orders.list(search, status));
        model.addAttribute("search", search);
        model.addAttribute("status", status);
        model.addAttribute("statuses", OrderService.STATUSES);
        return "admin/orders";
    }

    @GetMapping("/orders/{id}")
    String order(@PathVariable long id, Model model) {
        model.addAttribute("order", orders.detail(id, true));
        model.addAttribute("statuses", OrderService.STATUSES);
        return "admin/order";
    }

    @PostMapping("/orders/{id}/status")
    String status(@PathVariable long id, @RequestParam String status, RedirectAttributes flash) {
        try {
            orders.changeStatus(id, status);
            flash.addFlashAttribute("success", "Order status updated successfully.");
        } catch (ApiException error) {
            flash.addFlashAttribute("error", error.getMessage());
        }
        return "redirect:/admin/orders/" + id;
    }
}
