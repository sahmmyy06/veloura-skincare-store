/**
 * EXPRESS APPLICATION
 * ===================
 *
 * WHAT THIS FILE IS
 * The front door of the API. It builds the Express app, applies the settings
 * that affect every request, and mounts the route files.
 *
 * This file used to contain all sixteen endpoints. It is now deliberately
 * short: it wires things together and nothing more, so you can read the whole
 * thing in under a minute and see the complete shape of the API.
 *
 * HOW TO READ IT
 * Express runs setup in the order it appears here, so the file reads top to
 * bottom as "what happens to an incoming request":
 *
 *   1. security headers
 *   2. cross-origin rules
 *   3. JSON body parsing
 *   4. the Open Graph image (a special case, explained below)
 *   5. make sure the database is ready
 *   6. the actual routes
 *   7. the catch-all error handler
 *
 * THE URL MAP
 *   /api/health              is the server awake?
 *   /api/products            public product browsing
 *   /api/orders              public order placement and lookup
 *   /api/admin/*             everything behind the admin login
 *
 * The route files live in `server/src/routes/` and are named after their URL.
 * If you want to see what an endpoint does, the name of its file tells you
 * where to look.
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { ensureDatabaseReady } from './middleware/ensureDatabaseReady.js'
import { ogImageBuffer } from './og-image.js'

import publicProductRoutes from './routes/products.js'
import publicOrderRoutes from './routes/orders.js'
import adminAuthRoutes from './routes/adminAuth.js'
import adminDashboardRoutes from './routes/adminDashboard.js'
import adminProductRoutes from './routes/adminProducts.js'
import adminOrderRoutes from './routes/adminOrders.js'

const app = express()

/* ---------------------------------------------------------------------------
 * 1. SECURITY HEADERS
 * ---------------------------------------------------------------------------
 * Helmet adds a set of protective HTTP headers. One of them,
 * `Cross-Origin-Resource-Policy`, stops other websites from embedding our
 * files. We switch that one off because the product images are meant to be
 * loaded normally, and the setting would block them.
 */
app.use(helmet({ crossOriginResourcePolicy: false }))

/* ---------------------------------------------------------------------------
 * 2. CROSS-ORIGIN RULES (CORS)
 * ---------------------------------------------------------------------------
 * During local development the frontend runs on port 5173 and the API on 4000,
 * which browsers treat as different origins. CORS tells the browser that this
 * is allowed.
 *
 * `CLIENT_ORIGIN` names the one allowed frontend in production. When it is not
 * set we allow any origin, which is convenient locally and is why the variable
 * matters in production.
 *
 * `credentials: true` is required for the admin session cookie to travel
 * between the browser and the API.
 */
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
)

/* ---------------------------------------------------------------------------
 * 3. JSON BODY PARSING
 * ---------------------------------------------------------------------------
 * Parses incoming JSON so routes can read `req.body`. The 200kb limit is a
 * deliberate guard: product descriptions and orders are small, so a huge body
 * is almost certainly a mistake or an attack. It caps how much memory one
 * request can consume.
 */
app.use(express.json({ limit: '200kb' }))

/* ---------------------------------------------------------------------------
 * 4. OPEN GRAPH PREVIEW IMAGE
 * ---------------------------------------------------------------------------
 * This is the picture shown when the shop link is shared on social media.
 *
 * It is registered BEFORE the database check on purpose. Serving a static image
 * needs no database at all, so there is no reason to make social media crawlers
 * wait for one. It is also cached for a day, because the image never changes.
 */
app.get('/api/og-image.jpg', (_req, res) => {
  res.set({
    'Content-Type': 'image/jpeg',
    'Content-Length': ogImageBuffer.length,
    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
  })

  res.send(ogImageBuffer)
})

/* ---------------------------------------------------------------------------
 * 5. DATABASE READINESS
 * ---------------------------------------------------------------------------
 * Runs before every route below. It creates the tables and seeds the starter
 * products on the first request, then does nothing on later ones. See
 * `middleware/ensureDatabaseReady.js` for how the caching works.
 */
app.use(ensureDatabaseReady)

/* ---------------------------------------------------------------------------
 * 6. HEALTH CHECK
 * ---------------------------------------------------------------------------
 * A tiny endpoint that answers "is the server up?". Useful for confirming a
 * deployment worked without needing to log in.
 */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'veloura-api' })
})

/* ---------------------------------------------------------------------------
 * 7. ROUTES
 * ---------------------------------------------------------------------------
 * Each `app.use` hands a URL prefix to a route file. Everything inside that
 * file is then relative to the prefix, so `router.get('/')` inside
 * `routes/products.js` actually answers `GET /api/products`.
 *
 * The order matters in one place: `/api/admin/login` and the other auth routes
 * are mounted before the protected admin routes purely for readability. The
 * real protection comes from the `requireAdmin` middleware inside each
 * protected route file, not from the order of these lines.
 */
app.use('/api/products', publicProductRoutes)
app.use('/api/orders', publicOrderRoutes)

app.use('/api/admin', adminAuthRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/admin/products', adminProductRoutes)
app.use('/api/admin/orders', adminOrderRoutes)

/* ---------------------------------------------------------------------------
 * 8. CATCH-ALL ERROR HANDLER
 * ---------------------------------------------------------------------------
 * Express recognises this as an error handler because it takes four arguments.
 * Any error thrown by a route that did not handle it itself ends up here.
 *
 * We log the full error for the developer but send back a generic message, so
 * internal details are never exposed to the browser.
 *
 * This must be registered LAST, after every route, or it will not catch
 * anything.
 */
app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Unexpected server error.' })
})

export default app
