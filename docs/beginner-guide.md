# Read the Spring Boot app, one step at a time

This is still a Spring Boot project. You do not need React or Express to run it.
Start with one customer journey rather than trying to understand every file.

## First, run it

Install Java 17, then run these commands from the project folder:

```bash
./mvnw test
./mvnw spring-boot:run
```

Open the address printed in the startup log. The starting port is 4000; if it is
busy, the app keeps trying the following ports. Stop the app with Ctrl+C.
The first Maven run needs internet access to download its dependencies.

You can also run it with Docker. See README's Docker section. `Dockerfile` builds
and tests the app; `compose.yaml` describes how to start it and where to keep data.
The Docker build does not need Java installed on your computer. `Dockerfile.jar`
is an optional faster alternative when you have already packaged the app locally.
Docker's selected host port can differ from the fixed port inside the container.
The named database volume is separate from the container, so replacing the
container does not discard orders. Do not delete that volume accidentally.

## What each part does

| Part | Job | Start reading here |
| --- | --- | --- |
| Application | Starts Spring and retries occupied ports | `VelouraApplication.java` |
| Controller | Matches a URL and decides which response to send | `StorePages.java` |
| Service | Does the work, such as finding products or placing an order | `CatalogService.java`, `OrderService.java` |
| Template | Turns data into an HTML page | `templates/shop.html` |
| Browser code | Updates the bag and shows messages without reloading | `static/js/cart.js`, `notifications.js` |
| Database | Keeps products, orders, and order items | `schema.sql` |
| Test | Checks that the expected behaviour still works | `StoreIntegrationTest.java` |

Java files are under `src/main/java/com/veloura/store/`. HTML, CSS, JavaScript,
and database setup files are under `src/main/resources/`. Tests are under
`src/test/java/com/veloura/store/`. The old `client/` and `server/` folders are
legacy reference code, not the active app.

## Follow a shop page request

1. The browser asks for `/shop`.
2. Spring finds the matching `@GetMapping` method in `StorePages`.
3. The controller asks `CatalogService` for products.
4. The service uses `JdbcTemplate` to run a SQL query against SQLite.
5. The controller puts the products into a `Model`: named data for the page.
6. Returning `"shop"` tells Thymeleaf to render `templates/shop.html`.
7. Thymeleaf fills the HTML with that data and sends the finished page back.

In a template, `th:each` repeats an element for each item, `th:if` decides whether
to show an element, and `th:text` safely fills in text. `${products}` reads the
value named `products` from the model. These attributes run on the server.

## Follow an order

1. `cart.js` loads the saved bag from the browser's `localStorage`.
2. An Add button supplies product information through HTML `data-*` attributes.
3. Checkout sends customer fields, product IDs, and quantities to `/api/orders`.
4. `ApiController` receives the JSON and calls `OrderService`.
5. The service validates the customer and looks up current database prices.
6. It reduces stock and saves the order and its item snapshots.
7. Java returns the order number. The browser clears the bag and shows confirmation.

`@Transactional` makes the database changes succeed together. If a product is
short on stock, the exception causes those changes to roll back. Never trust
prices saved in the browser: a visitor can edit them. The Java service calculates
the real total. Money is stored as whole Naira, not floating-point decimals.

JavaScript here does not replace Spring. It runs in the browser for immediate
interactions. Spring still serves the pages and handles the database and API.

## Java and Spring terms you will see

- A **class** groups related data and methods. A **method** is a named operation.
- A `List` holds several values. A `Map` holds values under names, like `name`
  and `price`. `Map<String, Object>` means text keys with values of different types.
- `private` means only that class uses a member. `final` prevents reassignment
  of a variable; it does not automatically make a list or map immutable.
- A **record** is a short Java definition for a group of data fields. Java creates
  accessors such as `checkout.email()` for the fields.
- `@SpringBootApplication` marks the starting configuration of the app.
- `@Controller` returns HTML views; `@RestController` returns response data.
- `@Service` marks application work; `@Component` marks another Spring-managed object.
- **Constructor injection** means Spring supplies the objects a class needs.
  For example, Spring passes `CatalogService` to the `StorePages` constructor.
- `@Value` reads configuration, such as the admin email or allowed browser origin.
- `@Bean` exposes an object created by a configuration method to Spring.
- A SQL `?` is a placeholder. Pass user values separately, rather than joining
  them into SQL text. This prevents values from becoming SQL instructions.
- JSON is text for exchanging structured data. `ObjectMapper` converts between
  JSON and Java values. JavaScript uses `JSON.parse` and `JSON.stringify`.
- `async` and `await` let browser code wait for a network response without freezing
  the page. The `catch` block displays an error if that request fails.

## Admin access: read this after the shop flow

`AdminPages` handles admin HTML forms. `AdminSession` checks credentials and
creates a signed cookie. `AdminAccessInterceptor` checks requests before the
controller runs. `WebConfig` connects that interceptor to Spring MVC.

The signature detects cookie tampering. Base64 is an encoding, not encryption.
`HttpOnly` prevents JavaScript from reading the cookie. Origin checks protect
admin writes from other websites. Keep these checks even if the code looks
more advanced than ordinary product logic. Use your own credentials and secret
for production; the development defaults are not safe production credentials.

After an HTML form succeeds, a **flash attribute** carries a message through the
redirect. The next page turns it into a toast. This lets a refresh display the
page without submitting the same form again.

## Understand the tests

Read a test in three parts: **arrange** the starting state, **act** by making a
request or calling a method, then **assert** the expected result.

- `AdminSessionTest`: unit tests for cookies and credentials.
- `AvailablePortCustomizerTest`: port-selection tests using real occupied sockets.
- `ApplicationStartupTest`: startup retry tests, including real Tomcat binding.
- `StoreIntegrationTest`: Spring integration tests for API requests, rendered
  templates, authentication, products, and checkout. `MockMvc` calls real Spring
  handlers without needing a separate HTTP server. These tests use isolated SQLite.

`@Test` marks a test. `@BeforeEach` runs setup before each test. `assertEquals`
checks a value; `.andExpect(...)` checks a response. Browser checks complement
these tests: HTML responses alone cannot prove that a button or toast works.

For a first small change, edit a heading in `templates/our-story.html`, restart
the app, and open `/our-story`. Then read the controller method serving that page.
