# Veloura Skincare Store

Veloura now runs as a Java 17 Spring Boot application. Thymeleaf renders the
storefront, product pages, checkout, and admin workspace as HTML. CSS provides
the styling and small browser JavaScript manages the persistent bag. React and
Node.js are not required to run the active application.

New to programming? Start with the [beginner guide](docs/beginner-guide.md).
It explains the files, Spring annotations, checkout flow, and tests in plain English.

## Run

Install a Java 17 JDK and run from the repository root:

```bash
./mvnw spring-boot:run
```

Windows: `mvnw.cmd spring-boot:run`. The first run downloads Maven and dependencies.

Storefront: http://localhost:4000 · Admin: http://localhost:4000/admin
Checkout: http://localhost:4000/checkout · Health: http://localhost:4000/api/health
Shop: http://localhost:4000/shop · Our Story: http://localhost:4000/our-story

If port 4000 is occupied, startup automatically tries 4001, 4002, and so on.
Use the port shown in the startup log for both storefront and admin. A configured
PORT or server.port is used as the starting point; server.port=0 still lets the OS
assign a port.
If another process takes a checked port before Tomcat binds it, startup retries
from the following port. It continues until startup succeeds or port 65535 is
exhausted. Other startup errors are reported normally.

Development admin: `admin@veloura.store` / `veloura-admin`.

## Test and package

```bash
./mvnw test
./mvnw package
java -jar target/veloura-store-1.0.0.jar
```

JUnit 5 (Jupiter), Spring Boot Test, and MockMvc test the real controllers,
templates, and an isolated in-memory SQLite database. Tests cover authentication,
expired/tampered sessions, production credential handling, product CRUD/search,
order validation, database prices, inventory rollback, duplicate cart lines,
protected deletion, dashboard statistics, and HTML pages/forms.
Tests do not touch shop data. npm scripts call Java commands as a convenience.

## Layout and features

```text
src/main/java/com/veloura/store/  Java controllers, services, session protection
src/main/resources/templates/   Thymeleaf storefront and admin HTML
src/main/resources/static/      CSS, cart JavaScript, product assets
src/main/resources/schema.sql   Compatible SQLite schema
src/main/resources/products.json Original twenty-product catalogue
src/test/java/com/veloura/store/ JUnit 5 tests
pom.xml                         Maven dependencies and packaging
```

The browser requests a page, a Spring MVC controller loads data through Java
services, and Thymeleaf combines the data with an HTML template. Checkout calls
the Java API. Order creation and stock deduction share a transaction; purchased
names and prices are retained on historical order lines.

Features include product search and category filters, detail pages, persistent
bag with quantity controls, checkout and confirmation, signed HttpOnly admin
sessions, dashboard, product management, inventory, and order search/status updates.
The original public/admin JSON endpoint URLs remain available.

Customer navigation uses a focused home page, a separate shop (six products per
page with filters/pagination), and an Our Story page. Shared styled controls and
local SVG icons cover the storefront and admin workspace. Toast notifications
confirm bag actions, checkout results, login/logout, and admin saves/deletes/status
changes; errors have a separate dismissible toast treatment.

The HTML UI uses dedicated product and checkout pages in place of React modals.
Products and inventory share a management table. The generated Veloura logo,
favicon sizes, home/story photography, and twenty catalogue packaging mockups
are served locally from `src/main/resources/static/brand`, `images`, and
`products`. These are AI-generated concept visuals, not photographs of actual
stock or proof of packaging/ingredients. Replace them with verified product
photography before representing real stock. The placeholder remains a fallback
for custom products with missing images. Generation prompts are recorded in
`docs/generated-assets.md`.

## Data and configuration

The application creates `server/data/` automatically and opens
`server/data/veloura.db`. Existing local SQLite data is reused without dropping
tables. An empty catalogue receives the original twenty starter products.
Do not run the legacy backend against the same database simultaneously.

See `.env.java.example`. Export variables or configure them on the host; Spring
Boot does not load .env files automatically.

```bash
export VELOURA_PRODUCTION=true
export ADMIN_EMAIL=admin@yourdomain.com
export ADMIN_PASSWORD='your-strong-password'
export ADMIN_SESSION_SECRET='your-long-random-secret'
export CLIENT_ORIGIN=https://your-store.example
./mvnw spring-boot:run
```

Production mode disables demo credentials and enables Secure cookies. Use HTTPS.
PORT defaults to 4000. DATABASE_URL accepts a SQLite JDBC URL, such as
`jdbc:sqlite:/data/veloura.db`; create its parent directory when using a custom
location. Keep SQLite on persistent storage.

## Deployment

### Docker: local startup

Install Docker Engine/Desktop with Docker Compose, then run:

```bash
docker compose up --build -d
docker compose port store 4000
```

The second command prints the address, for example `127.0.0.1:4002`.
Open `http://localhost:4002` (use your printed port). Docker chooses a free port
in the 4000–4099 range; this is not Spring's host-level retry loop. If the whole
range is occupied, choose a different range using the optional configuration below.
To request a fixed port, set `HOST_PORT_RANGE=4100`; Docker then fails if it is busy.
Spring always uses port 4000 inside this container.

Compose defaults to **local development**, reachable only from this computer.
Admin: `admin@veloura.store` / `veloura-admin` unless you supply custom settings.
Do not expose this development configuration publicly.

```bash
docker compose ps                 # Container status and health
docker compose logs -f store      # Follow Spring's logs; Ctrl+C stops log viewing
docker compose down               # Stop containers; keep the database volume
```

The Docker build runs JUnit tests and packages Java, HTML, CSS, and all images.
No host Java, Maven, Node, or React build is required. The runtime uses a non-root
user and checks `/api/health` regularly.

If you already have Java 17 and want to avoid downloading Maven's Docker build
image, use the optional JAR build instead:

```bash
./mvnw package
docker build -f Dockerfile.jar -t veloura-store:local .
docker compose up -d --no-build
docker compose port store 4000
```

This runs the same app with the same volume and permissions. Repackage and rebuild
after code changes; the JAR build cannot see edits made after packaging.

### Docker: custom settings and production

Copy `.env.docker.example` to `.env.docker`, edit it with your own credentials,
then run:

```bash
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker port store 4000
```

Use `--env-file .env.docker` consistently for later Compose commands too.
Compose passes these settings to Spring; private environment files are excluded
from Git and the image. For production set `VELOURA_PRODUCTION=true`, use your
HTTPS website as `CLIENT_ORIGIN`, and place the container behind an HTTPS reverse
proxy. Secure admin cookies will not work over ordinary HTTP in production mode.
The raw Docker image defaults to production; Compose explicitly defaults to local
development. You can still deploy the executable JAR directly on a JVM host.

### Docker database storage

SQLite lives in the named `veloura-data` Compose volume, not the image. It survives
rebuilds and `docker compose down`. **Do not use `docker compose down -v` unless
you intentionally want to delete the Docker database.** Back it up before changes.
The first run seeds twenty products in a new database. It does not automatically
copy your existing `server/data/veloura.db`; that host database is left untouched.
Ask for a separate migration if you want to bring existing orders into Docker.
Keep one app container per SQLite database; do not run multiple replicas on it.

The former Vercel Node-function setup does not run Java. Turso is not supported
by this SQLite JDBC backend. Export remote Turso data to SQLite before switching
if you need that catalogue/order history. No remote migration or deployment
has been performed.

## Legacy reference

`client/`, `server/src/`, `api/`, and `vercel.legacy.json` retain the former
React/Express version. They are not part of the Java runtime.
After installing legacy dependencies, `npm run legacy:dev` runs it separately.
Both backends default to port 4000; the Java app advances if it is occupied.
Use separate databases if running both versions simultaneously.

## JSON API

Public: GET /api/health, GET /api/products, GET /api/products/{id},
POST /api/orders, GET /api/orders/{orderNumber}.

Admin: POST /api/admin/login, POST /api/admin/logout, GET /api/admin/me,
GET /api/admin/dashboard, GET/POST /api/admin/products,
PUT/DELETE /api/admin/products/{id}, GET /api/admin/orders,
GET /api/admin/orders/{id}, PATCH /api/admin/orders/{id}/status.
