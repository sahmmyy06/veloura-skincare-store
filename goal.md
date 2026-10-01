# Goal — Java Spring Boot and HTML migration

Status: complete — Docker packaging and local container workflow.

The user requested Java Spring Boot and JUnit 5, then clarified that the UI
should also move to Java-rendered HTML. The active implementation uses Thymeleaf.

Completed segment: improved the Docker image, added beginner-friendly Compose setup,
persistent SQLite, secret exclusions, and verified local container startup.
The beginner-friendly code rewrite is complete.
Spring Boot, MVC, Thymeleaf, JDBC, and JUnit 5 remain the active stack.
Routes, authentication, checkout, UI, and port fallback remain working.
The legacy React/Express reference and unrelated user changes were preserved.

## Implemented

- Docker Compose with localhost-only free-port selection (4000–4099), named SQLite
  storage, local/production configuration, non-root UID 10001, and HTTP health check.
  Standard Dockerfile builds/tests source; Dockerfile.jar packages an existing JAR.
  README explains both routes, credentials, HTTPS, and data-preserving shutdown.
- Beginner-friendly Java services/controllers/startup, a focused admin interceptor,
  plain-loop browser cart code, clearer toast callbacks and checkout HTML, and
  explanatory schema comments. README links docs/beginner-guide.md.
- JUnit tests use descriptive names and explicit types; added pagination-boundary
  and admin-origin/security-header regression coverage.
- Built-in image generation produced a transparent logo with favicon/touch sizes,
  two editorial photographs, a PNG share derivative, and twenty product mockups.
  All assets are saved under static/brand, static/images, and static/products.
  Prompts and limitations are recorded in docs/generated-assets.md.
- Split customer navigation into Home, Shop, and Our Story; paginated the shop
  to six products per page and corrected the missing product-grid styling.
- Shared branded buttons, locally served SVG icons, and dismissible success/error
  toasts for shopping and admin actions.

- Automatic port selection: start at the configured port and advance when occupied.

- Java 17 Maven application, Spring MVC API, and signed admin sessions.
- Compatible SQLite schema and original twenty-product seeds.
- Atomic checkout, trusted prices, inventory rollback, and historical snapshots.
- Thymeleaf storefront, search, product detail, bag/checkout, and admin forms.
- JUnit 5 unit/integration tests with isolated SQLite.
- Java run/build scripts, wrapper, Docker build, and configuration documentation.
- Existing React/Express source preserved as legacy reference.

## Verification

- Docker update: Compose validation and standard Dockerfile build checks pass.
  Built veloura-store:local using Dockerfile.jar and the already-tested JAR.
  Docker integration checks passed health, non-root UID, two occupied host ports,
  all twenty seeds, HTML/images, admin login, checkout, and order/stock persistence
  after container recreation. Temporary QA project and volume were removed.
  A test-client socket reuse error after recreation was fixed by using new HTTP
  connections, not by changing the app. The standard source-image build was stopped
  during a slow Maven/Java image download; that full build is not verified.
  Local Compose uses its own new database; host store data was not imported or changed.
  Regular Compose service is running healthy at http://localhost:4000; its health
  endpoint responds with ok=true and service=veloura-api.
- Latest readability update: all 20 JUnit tests and Maven packaging pass (4 session,
  10 integration, 3 port-selection, 3 startup-retry). JavaScript syntax and
  git diff whitespace checks pass.
- Playwright on localhost:4080 with disposable SQLite verified pagination/search,
  cart persistence/add/remove/quantity edits, checkout success and stock errors,
  admin login/product save/delete/logout, and associated toasts. A separate check
  passed damaged saved-JSON recovery, three-toast cap, hover pause, automatic
  dismissal, and empty-bag checkout disabling. All twenty images decoded; desktop
  1440×1000 and mobile 390×844 routes had no errors or horizontal overflow.
- Inspected current home desktop and shop mobile screenshots. Browser plugin was
  unavailable; Playwright was used. The first interaction run timed out on initial
  page load; rerunning the unchanged script passed. Production/other browsers and
  mobile admin interactions were not tested. Store data was not used for QA.
- Latest image update: all 18 JUnit tests and Maven packaging pass, including a
  regression serving every generated product image and branding/photo derivative.
- Playwright verified all twenty product images return image/webp and decode;
  home/shop/story/product detail passed at 1440×1000 and 390×844. Inspected all
  generated images and desktop/mobile screenshots; bag action still shows a toast.
  No console/script errors, failed HTTP responses, or horizontal overflow.
- Latest UI browser pass: paginated shop/search, icons, bag add/remove and toast
  dismissal, checkout success/stock-error toasts, admin login success/error,
  product save/delete, and logout notifications passed. Home, shop, story,
  checkout, and admin login had no horizontal overflow at 390×844.
- Inspected new home/shop desktop and mobile screenshots. No script errors or
  unexpected HTTP failures; missing product images fall back to the placeholder.
- JUnit 5: 18 tests passed (4 session tests, 8 API/HTML integration tests,
  3 port-selection tests, 3 startup-retry tests).
- A real Tomcat regression test deliberately took two checked ports before bind;
  startup retried twice, succeeded on the following port, and served /api/health.
- Maven package: passed; executable Spring Boot JAR built successfully.
- Legacy React reference build: passed (1611 modules, CSS 23.57 kB).
- JavaScript syntax and git diff whitespace checks: passed.
- Playwright on localhost:4080 with disposable SQLite: catalogue, search, bag
  quantities, checkout confirmation, admin login, product creation, order status,
  and logout passed at desktop; storefront also checked at mobile size.
- Final browser pass confirmed the placeholder loads successfully. Six expected
  missing final product-image requests fell back to the SVG; no script errors
  or unexpected failed HTTP responses remained.
- Browser checks used Playwright because the Browser plugin skill was unavailable.
  Desktop 1440×1000 and mobile 390×844 screenshots were inspected.
- Fixed duplicate-slug error translation and the product route intercepting static
  image URLs; regression assertions cover missing resources and placeholder SVG.

## Scope and limits

HTML pages replace React modals. No production deployment or remote Turso
migration is part of this local change. Product renders are generated concepts,
not verified stock photography. Logo trademark clearance was not performed.
Local Docker runtime was tested; HTTPS production deployment and remote data were not.
The original JPEG
share-image bytes are preserved, including their previously documented corruption;
the HTML pages now reference the new local generated PNG share image.
