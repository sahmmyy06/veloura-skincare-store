# Implementation Log

A dated record of meaningful changes. Newest entries go at the top.

The rule: if a change is big enough that someone would ask "when did that happen?",
it belongs here.

---

## 2026-10-01 — Docker runtime and persistent storage

The user requested Docker. Improved the existing two-stage source Dockerfile with
dependency caching, non-root UID 10001, a writable data directory, and HTTP health
checks. Added compose.yaml for one Spring/Thymeleaf container, localhost-only host
port selection in 4000–4099, restart policy, and a named SQLite volume. Compose
defaults to local HTTP/development; the raw image defaults to production. Private
credentials stay outside the build context. Added .env.docker.example and clear
README instructions for startup, settings, HTTPS, volumes, and shutdown.

The source build's Maven/Java image download was very slow, so stopped that build
and added an optional Dockerfile.jar for the existing packaged application, with
its own JAR-only build context. Built veloura-store:local successfully this way.
Its runtime permissions, environment, health check, and data path match the main
Dockerfile. The existing JAR came from the previously passing 20-test Maven build.
The standard source Dockerfile passes docker build --check with no warnings, and
Compose validation passes, but its complete source-image build was not verified.

Isolated Docker integration tests passed health, UID 10001, two ports held by real
host processes (selected the third), twenty products, HTML/static images, admin
login, checkout, and saved order/stock surviving container recreation. The test
client initially reused a connection from the stopped container; opening fresh
connections made that check reliable. No application fix was required. Removed
only the disposable QA project/volume and left the host shop data unchanged.
Started the regular local Compose service with a separate persistent database.
No existing orders were imported. HTTPS production deployment was not tested.

---

## 2026-10-01 — Beginner-friendly Spring code

The user requested code that early programmers can easily follow and confirmed
that Spring should remain. Kept Spring Boot, MVC, Thymeleaf, JDBC, and JUnit 5.
Replaced compact conditions, stream-based value assembly, nested expressions,
and short names with explicit steps and meaningful names across active Java code.
Checkout now explains its transaction, trusted prices, stock reservation, and
historical snapshots. Session code explains cookie signing without weakening it.
Moved the existing admin request checks from an anonymous interceptor into the
focused AdminAccessInterceptor; WebConfig still registers it with Spring MVC.

Rewrote browser bag transformations as plain loops and named functions, expanded
toast timing callbacks, and explained the server/browser boundary. Made shop and
checkout templates clearer and added database-schema comments. Added
docs/beginner-guide.md with a reading order, request/order flows, a Spring/Java
glossary, and test explanations. README and agent guide point to the active app.
Legacy React/Express files and unrelated user changes were left alone.

Verification: all 20 JUnit tests and Maven packaging pass. Added regressions for
pagination boundaries and admin origins/security headers; reformatted integration
assertions and made test types explicit. The new CORS test initially assumed a
JSON error; Spring rejects these requests earlier with its own forbidden response,
so the test now checks the actual 403 contract. No application change was needed.
JavaScript syntax and diff whitespace checks pass.

Playwright verified shop pagination/search, add/remove, quantity edits, checkout
success/stock errors, admin login/product save/delete/logout, and toasts. Additional
checks passed corrupt saved-JSON recovery, repeat-add persistence, invalid-quantity
reset, empty-bag checkout disabling, three-toast cap, hover pause, and auto-dismiss.
All twenty image URLs decoded; desktop 1440×1000 and mobile 390×844 image/page
checks found no console/script errors, failed responses, or horizontal overflow.
Current home desktop and shop mobile screenshots were inspected. Browser plugin
was unavailable. An initial interaction run hit a page-load timeout; the unchanged
script passed on rerun. QA used disposable SQLite. Production, other browsers,
and mobile admin interactions were not verified.

---

## 2026-10-01 — Generated brand and catalogue assets

The user requested a logo icon and the pictures needed by the project. Used the
built-in image generator to create a transparent botanical logo, two editorial
images, and individual packaging mockups for the twenty seeded products.
Integrated the logo into customer/admin branding and added favicon/touch sizes.
Hero/story images now use local files; shop images use contain-fit to preserve
the whole package. Product pictures retain the existing catalogue filenames,
so no store data changes are required. Product visuals are concepts, not actual
stock photography. Prompts and saved paths are in docs/generated-assets.md.

Verification: all 18 JUnit tests and Maven packaging pass. Added a regression
serving all twenty images plus logo/favicon/editorial/share derivatives.
Playwright verified every product image returns image/webp and decodes, then
checked home/shop/story/product detail at 1440×1000 and 390×844, including
add-to-bag toast feedback. Inspected all generated images and desktop/mobile
screenshots; no horizontal overflow, browser errors, or failed HTTP responses.
Browser plugin was unavailable, so regular Playwright was used. All checks used
a disposable SQLite database, not store data. Production and other browsers
were not tested; generated mockups are not verified commercial stock photos.

---

## 2026-10-01 — Customer pages, controls, icons, and notifications

The user reported default buttons, an overly long storefront, missing icons,
and requested toast notifications. Split home, shop, and story into dedicated
routes. Fixed the template's unstyled product-grid class and paginated the shop
to six products per page. Added shared button variants, local SVG icons, and
success/error toast feedback for bag actions, checkout, and admin form redirects.
Checkout uses a two-column desktop layout and stacks on mobile. Preserved the
existing brand palette, typography, imagery, and Java/Thymeleaf implementation.

Verification: Maven packaging and all 17 JUnit 5 tests pass. Playwright verified
home/shop/story navigation, six-product pagination, search, local SVG loading,
bag add/remove, toast dismissal, checkout stock errors and successful orders,
admin login errors/success, product save/delete, and logout notifications.
Desktop 1440×1000 and mobile 390×844 screenshots were inspected; five mobile
routes had no horizontal overflow. No browser script errors or unexpected HTTP
failures occurred. Missing final product renders still use the existing SVG
placeholder. Checks used a disposable database, leaving the user's running
server and store data unchanged.

---

## 2026-10-01 — Automatic port fallback

Follow-up: added a startup retry loop for actual PortInUseException failures,
including nested failures after the availability probe. Each retry overrides the
original configured port and starts a fresh context from the following port.
Tests simulate two consecutive actual bind failures and verify unrelated failures
and an exhausted port range are propagated.

Added a Tomcat factory customizer that checks the resolved starting port and
advances to the next available port when occupied. It respects PORT/server.port,
the configured bind address, and OS-assigned port 0. Existing listeners are left
running. The startup log reports the selected fallback port. Added JUnit 5 tests
using real occupied sockets, and documented how to find the app's URL.

Verification: all 17 JUnit 5 tests and Maven packaging pass. A real Tomcat test
forced two successive bind failures after probing; startup advanced twice and
the final server returned HTTP 200 from /api/health. A separate JAR smoke test
with two occupied ports selected the next port and returned a healthy response.

---

## 2026-10-01 — Spring Boot backend and HTML UI

The user requested Spring Boot and JUnit 5 and clarified that the UI should also
move to Java-rendered HTML. Added Java 17/Spring Boot with Thymeleaf storefront
and admin forms, SQLite JDBC, original seeds, signed admin cookies, preserved
JSON API URLs, and transactional checkout. Conditional stock updates reject
overselling even with repeated cart product IDs.

Added isolated JUnit 5 tests for authentication, CRUD, checkout rollback, and
rendered pages/forms. Changed default commands to Java and added Maven Wrapper
and Docker packaging. Former React/Express source remains as reference; the
Vercel Node config is saved as vercel.legacy.json. Remote Turso migration and
production deployment were not performed. Verification is tracked in goal.md.

Verification: 11 JUnit 5 tests pass; executable JAR packaging and the retained
React build pass. Playwright exercised storefront search, bag quantity editing,
checkout, admin login, product creation, order status, and logout; desktop/mobile
screenshots were inspected. Added regressions for SQLite duplicate-slug translation
and static image routing. Mockito was excluded because tests use real services and
the sandbox blocks its otherwise unnecessary JVM agent attachment.

---

## 2026-02-14 — Readability rewrite for presentation

**Why:** A non-coder has to present this project and explain the code. The code was
minified and over-packed, which made explanation impractical.

### What changed

**Documentation created**
- `agent.md` — rules for agents working here, including Update Discipline and
  Implementation Readability Rules, plus a plain-English map of the project layout
  and how a request flows through the stack.
- `goal.md` — the current objective, progress, verification log, and blockers.
- `docs/implementation-log.md` — this file.
- `docs/session-handoff-next.md` — what is unfinished for the next person.

**Baseline captured before any edit**
- `cd client && ./node_modules/.bin/vite build` → PASS.
  Output: `index-*.css` 23.56 kB (23,557 bytes on disk), `index-*.js` 182.00 kB.
- Backend smoke test → PASS. 20 products seeded; admin login 200;
  `/api/admin/me` returned authenticated; `POST /api/orders` created
  `VEL-…` with total 37,000; invalid email rejected with 400; dashboard reported
  `total_orders: 1, revenue: 37000, customers: 1, pending: 1` and
  `total_products: 20, total_units: 428, low_stock: 0`.
- Seed data dumped to JSON as a reference for an exact comparison later.

These numbers are the reference for proving the rewrite changed no behavior.

**Stylesheets expanded**

| File | Before | After |
| --- | --- | --- |
| `client/src/styles.css` | 4 lines, longest **8,904** characters | 989 lines, longest 144 |
| `client/src/admin/admin.css` | 5 lines, longest **890** characters | 977 lines, longest 131 |

Both were rewritten one declaration per line, with a file banner explaining how to
read them and section banners naming each block. All 151 + 161 = **312 CSS rules
were preserved** — verified by normalising whitespace and diffing against the
originals, which showed the files are identical apart from optional trailing
semicolons.

The final CSS bundle is **23.57 kB against the 23.56 kB baseline**, confirming no
rules were lost.

**Backend split from one 311-line file into focused files**

`server/src/app.js` (311 lines, 16 endpoints) became 168 lines that only assemble
the app. Everything else moved:

- `routes/` — `products.js`, `orders.js`, `adminAuth.js`, `adminDashboard.js`,
  `adminProducts.js`, `adminOrders.js`
- `middleware/` — `requireAdmin.js`, `ensureDatabaseReady.js`
- `lib/` — `adminSession.js`, `cookies.js`, `products.js`, `orders.js`

`db.js` was also rewritten: the 20 seed products went from packed one-line arrays
(maximum 262 characters) to readable field-by-field objects with comments.

**Storefront split from one 89-line file into 12 components**

`client/src/App.jsx` (89 lines of mega-lines) became a 192-line section list.
The hero, benefit strip, shop grid, story, footer, header, cart drawer, checkout
form and three modals each became their own file. Cart and product-fetching logic
moved into `hooks/`, and shared helpers into `lib/`.

**Admin split from one 243-line file into 9 components**

`client/src/admin/AdminApp.jsx` (243 lines holding 9 components) became a 100-line
shell. The login screen, sidebar, dashboard, product table, product modal, order
table and order drawer each became their own file, with auth and data loading in
`hooks/`.

**`server/src/og-image.js` made readable**

A 25,634-character single-line base64 JPEG was split into 85 short lines of
76 characters. **The decoded bytes were verified identical by SHA-256.**

While doing this, a pre-existing problem was found and documented rather than
silently changed: see "Discovery" below.

### Discovery — the share image is corrupt (pre-existing)

`server/src/og-image.js` holds 6,429 base64 characters. Valid base64 must be a
multiple of 4, and 6,429 is not, so the data is truncated. The decoded 4,821
bytes begin with a correct JPEG header (`FF D8 FF`) but end with `CF FF` instead
of the JPEG end marker (`FF D9`).

**This was not fixed**, because fixing it means replacing the image, which is the
owner's decision rather than a formatting change. It is recorded in
`docs/session-handoff-next.md`. The bytes were left byte-for-byte unchanged.

### Verification

- **Client build:** PASS. 1611 modules. CSS `23.57 kB`, JS `186.05 kB`.
  The JavaScript grew from 182.00 kB to 186.05 kB, which is expected: splitting
  code into more modules adds import machinery, and comments are included in the
  development source. The CSS is the meaningful comparison for the stylesheets.
- **Backend smoke test:** PASS, **18 of 18 checks.** Covered: health; 20 products;
  bestsellers ordered first; admin login 200; cookie carries `HttpOnly` and
  `SameSite=Lax`; `/me` authenticated; unauthenticated dashboard rejected with 401;
  order created 201 with a server-calculated total of 37,000; stock deducted by
  exactly the quantity ordered; customer email stored lowercase; overselling
  blocked with a named-product error; dashboard revenue and unique-customer counts
  correct; share image served 200; logout 200.
- **Seed data:** byte-for-byte identical to the original, confirmed by dumping
  both to JSON and diffing.
- **Share image bytes:** byte-for-byte identical, confirmed by SHA-256.
- **Dev servers:** the API and Vite both started, the page was served, and the
  `/api` proxy returned live product JSON with no errors in either log.

### Not verified

**The rendered UI was never seen.** No browser or screenshot tooling is available
here. A passing build proves the React code compiles and every import resolves; it
does not prove the pages look correct. The presenter should open
`http://localhost:5173` and `http://localhost:5173/admin` once to confirm.

### Environment notes discovered

- `npm install` fails in this sandbox: the npm cache is on a read-only filesystem.
  `bun install` succeeds when given a writable temp dir:
  `BUN_TMPDIR=$PWD/.bun-tmp bun install`.
- Running the server locally required creating `server/data/` first, because the
  libSQL client cannot create the database file if its parent directory is missing.
  `server/data/*.db` is gitignored.
- `bun install` created an untracked `client/bun.lock`. A `bun.lock` already
  existed at the repository root before this work; both are untracked.

### Remaining

See `docs/session-handoff-next.md`.
