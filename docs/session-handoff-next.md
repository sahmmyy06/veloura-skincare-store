# Session Handoff — Java migration

The active app is Java 17 + Spring Boot + Thymeleaf, with JUnit 5.
Run ./mvnw test and ./mvnw spring-boot:run at the root; UI and API start at port 4000
and advance to the next available port if occupied. Read the actual port in the log.
See README.md and goal.md for configuration and verification.

Docker is now configured and its local runtime verified. Use docker compose up
--build -d for a source build, or the documented Dockerfile.jar route with an
already-packaged JAR. The currently built veloura-store:local image used the JAR
route because the Maven base-image download was slow. The full source-image build
was not completed; docker build --check and Compose validation pass. Runtime QA
verified health, UID 10001, occupied-host-port selection, login, checkout, and
SQLite persistence after recreation. Regular local Compose has been started;
docker compose port store 4000 prints its actual address. Stop with docker compose
down (without -v to preserve data). Private optional settings go in .env.docker.
At this handoff, the regular container is healthy at http://localhost:4000.
The Docker volume starts with a new catalogue; existing host orders were not copied.
Maintain matching runtime permissions/health settings in Dockerfile and Dockerfile.jar.

The beginner-friendly rewrite is complete. Start with docs/beginner-guide.md;
it explains the active Java request flow and Spring annotations. Java services
use explicit steps; cart/toast code uses named callbacks and plain loops. Spring
still provides routing, dependency injection, templates, transactions, and startup.
AdminAccessInterceptor now contains the existing admin checks registered by WebConfig.
Latest verification: 20 JUnit tests and packaging pass, including new pagination
and origin/security-header regressions. Browser customer/admin flows pass;
cart persistence, invalid quantities, empty-bag disabling, toast cap/pause/expiry,
and desktop/mobile imagery were also checked. One initial browser navigation
timed out; the unchanged interaction script passed on rerun. No new dependencies.

Customer routes: / (compact welcome), /shop (six products per page), /our-story,
/products/{id}, and /checkout. Shared controls/icons and success/error toast
notifications cover storefront and admin forms. Restart the Java process after
updating code/resources so cached templates use the new version.

React/Express source is preserved as legacy reference. Existing local SQLite
data is compatible. Remote Turso data requires export/import before production
switches. vercel.legacy.json preserves the former Node deployment configuration;
deploy the Java JAR or Docker image on a JVM host with persistent SQLite storage.

The logo, favicon/touch icons, hero/story/share imagery, and all twenty starter
product mockups are now local assets. Read docs/generated-assets.md for prompts
and file paths. These AI-generated mockups are not verified stock photography;
replace them with actual product photography before representing real stock.
Custom products with missing URLs still use the placeholder. HTML navigation
uses pages in place of React modals.
No production deployment or remote migration has been performed.

Validation: 18 JUnit 5 tests and JAR packaging pass; the legacy client build passed
during the migration. Port fallback tests use real occupied sockets.
Startup also retries actual port-in-use failures until it succeeds or reaches
the end of the port range, including conflicts that happen after probing.
Latest desktop browser checks covered pagination, icons, bag/toast dismissal,
checkout success/errors, admin login success/errors, product save/delete, and
logout notifications. Home, shop, story, checkout, and admin login had no mobile
horizontal overflow at 390×844. Home/shop desktop and mobile screenshots were
inspected. Placeholder image routing has a regression test.
HTTPS production deployment and mobile admin interactions were not separately verified.
Latest asset verification covered all twenty WebP image URLs and decoding;
home/shop/story/product detail rendered at desktop/mobile with no console errors,
HTTP failures, or overflow. Add-to-bag toast behavior remained working.
