# Agent Guide — Veloura Skincare Store

## Current stack (2026-10-01)

The active app is Java 17, Spring Boot, Thymeleaf HTML, SQLite JDBC, and JUnit 5.
Read README.md and goal.md for current commands. Java sources live in
src/main/java/com/veloura/store; templates and assets live in src/main/resources.
Run ./mvnw test and ./mvnw spring-boot:run. The React/Express layout and commands
below describe the preserved legacy version. Apply readability/documentation
rules to Java too; verify the active app using JUnit and rendered-page checks.
For the active request flow and reading order, use docs/beginner-guide.md.
All layout, request-flow, and run instructions below referring to client/server
describe the legacy app, not the active Spring app.

This file tells any AI agent (or new human) how to work in this repository.

Read this file first, then `goal.md`, then `docs/implementation-log.md`.

---

## What This Project Is

Veloura is a small full-stack e-commerce website that sells skincare creams.

It has two faces:

1. **The storefront** — what a customer sees. Browse products, search, add to a bag,
   and place an order. Lives in `client/src/`.
2. **The admin workspace** — what the shop owner sees at `/admin`. Log in, manage
   products and stock, and update customer orders. Lives in `client/src/admin/`.

The backend is one Express server in `server/src/` that serves the API for both.

**Important for presenters:** this project is written to be *read and explained*,
not to be clever. If you are looking for the shortest possible code, this is not it,
and that is intentional.

---

## The Layout, In Plain English

```
veloura-skincare-store/
├── agent.md                     ← you are here (rules for agents)
├── goal.md                      ← what we are doing right now
├── README.md                    ← how to run and deploy
│
├── docs/
│   ├── implementation-log.md    ← dated history of real changes
│   └── session-handoff-next.md   ← what is unfinished, for the next person
│
├── client/                      ← the browser app (React + Vite)
│   ├── src/
│   │   ├── main.jsx             ← entry point; picks storefront or admin
│   │   ├── App.jsx              ← storefront page shell
│   │   ├── styles.css           ← storefront styles
│   │   ├── components/          ← storefront building blocks
│   │   │   ├── storefront/      ← header, hero, product grid, cart, checkout
│   │   │   └── ui/              ← tiny shared pieces (buttons, modals, money)
│   │   ├── hooks/               ← reusable state logic (cart, products)
│   │   ├── lib/                 ← plain helper functions (fetch, formatting)
│   │   └── admin/               ← the admin workspace
│   │       ├── AdminApp.jsx     ← admin page shell
│   │       ├── admin.css        ← admin styles
│   │       ├── components/      ← login, sidebar, tables, modals
│   │       ├── hooks/           ← admin data loading
│   │       └── lib/             ← admin API helper + constants
│
├── server/                      ← the API (Express)
│   └── src/
│       ├── index.js             ← starts the server locally
│       ├── app.js               ← assembles the app (small, readable)
│       ├── db.js                ← database connection + seed data
│       ├── og-image.js          ← social preview image bytes
│       ├── lib/                 ← helpers (validation, ids, responses)
│       ├── middleware/          ← auth + database readiness
│       └── routes/              ← one file per group of endpoints
│
└── api/                         ← thin Vercel entry wrappers around server/src
```

### How a request flows (the single most useful thing to understand)

1. The browser calls a URL such as `GET /api/products`.
2. Vercel (in production) or the Vite dev proxy (locally) sends it to the Express app.
3. `server/src/app.js` matches the URL to a route file in `server/src/routes/`.
4. The route file runs SQL through `server/src/db.js`.
5. The route sends JSON back, and a React component renders it.

Once that chain clicks, every file in this project has an obvious home.

---

## Update Discipline

Use goal.md to choose the current segment before broad implementation work.
Update docs/implementation-log.md after meaningful changes.
Update docs/session-handoff-next.md when leaving follow-up work.
Update goal.md with progress, verification, remaining work, and blockers.
Keep docs and code aligned; do not let docs claim implemented behavior that is only planned.

---

## Implementation Readability Rules

These rules override default instincts. The standard is whether a tired human can open a file at 11pm and understand it in 30 seconds.

### Formatting
Never minify or hand-compress CSS, JavaScript, TypeScript, JSON, React, or JSX.
Do not pack several rules or statements onto one line merely to make a diff smaller.
Give every CSS declaration its own line.
Break JSX elements with more than about two attributes across lines.
Treat lines longer than about 100 characters as a signal to reformat.
Keep every file readable without horizontal scrolling or squinting.

### File Responsibility
A component renders one piece of UI. Split it when it mixes more than about two of authentication/session state, list rendering, detail rendering, form handling, or data fetching.
Around 150 lines is a review signal for a React component. Split by responsibility when it makes the flow clearer; do not split cohesive code only to satisfy a number.
Move distinct hooks, types, and API calls to focused files such as useFeature.ts, types.ts, and api.ts.
Cohesive CSS, migrations, types, schemas, constants, and structured-data files may exceed 150 lines when splitting them would hide their single responsibility. They must still be easy to scan.

### Design And Scope
Do not create a generic, config-driven, factory, or plugin abstraction for one use. Abstract only after the same pattern appears at least three times.
Prefer direct, descriptive, junior-friendly code that remains easy to modify six months later.
Use descriptive names. Avoid one-letter names except trivial loop counters.
Do not add defensive flags, cancellation, mounted guards, or blanket try/catch blocks without a concrete failure scenario.
Small requests get small diffs. Do not refactor or improve nearby code unless the request includes that work.
Ask instead of guessing when an assumption would materially expand the requested scope.

### Before Finishing
Review long React components for mixed responsibilities.
Confirm files are readable and not compressed.
Confirm every abstraction has repeated, real use.
Confirm each defensive guard protects a plausible case.
Confirm someone unfamiliar with the change can understand it in one pass.

---

## Project-Specific Conventions

**Comments are a feature here.** Every file starts with a short banner comment saying
what it is and why it exists. Non-obvious lines get a plain-English comment above them.
Comments explain *why*, never restate the obvious.

**Naming.** Components use `PascalCase.jsx`. Hooks start with `use`. Plain helpers use
`camelCase.js`. API route files are named after their URL group, e.g. `products.js`.

**Money.** All prices are whole Naira integers. `formatMoney()` in
`client/src/lib/format.js` is the only place that adds the `₦` symbol.

**Never invent a behavior in a comment.** If a comment describes what the code does,
the code must do exactly that.

---

## Running The Project

```bash
bun install --prefix client     # or: npm run install:all
npm run dev                     # storefront :5173, API :4000
```

Build check (this is the main automated verification):

```bash
cd client && ./node_modules/.bin/vite build
```

**Sandbox note:** in a restricted environment, `npm install` can fail on a read-only
cache. `bun install` works when pointed at a writable temp directory:

```bash
BUN_TMPDIR=$PWD/.bun-tmp bun install
```

---

## Verification Expectations

Before claiming any change is done:

1. `cd client && ./node_modules/.bin/vite build` must succeed.
2. The backend smoke test must pass (health, products, admin login, order creation).
3. Docs must be updated in the same change (see Update Discipline).

Be honest about what was *not* verified. A passing build proves the code compiles,
not that the screen looks right. Say which parts were not checked.

---

## Things That Are Easy To Get Wrong

- **Admin auth uses a signed cookie, not a session table.** See
  `server/src/middleware/requireAdmin.js`. The signature is an HMAC of
  `email|expiry` — there is no server-side session store.
- **The database initializes lazily.** `ensureDatabaseReady` runs before every API
  request and caches its promise, so the schema and seed data are created on the
  first request rather than at boot.
- **Stock is decremented inside a write transaction** when an order is placed, and
  the whole order rolls back if any item is short on stock.
- **`api/` at the repo root is not duplicated logic.** Those files only re-export
  `server/src/app.js` so Vercel can deploy it as a serverless function.
