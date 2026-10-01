/**
 * ADMIN AUTHENTICATION ROUTES
 * ===========================
 *
 * WHAT THIS FILE IS
 * The three endpoints that control signing in and out of the admin workspace:
 *
 *     POST /api/admin/login   sign in with email + password
 *     POST /api/admin/logout  sign out
 *     GET  /api/admin/me      "am I still signed in?"
 *
 * WHY `/me` EXISTS
 * The admin page is a React app. When it first loads it has no idea whether the
 * visitor is signed in, because the session cookie is HttpOnly and JavaScript
 * cannot read it. So the app asks `/api/admin/me`:
 *
 *   * 200  -> show the dashboard
 *   * 401  -> show the login screen
 *
 * That is the entire reason a "who am I" endpoint is needed.
 */

import express from 'express'
import { adminConfig, createSession, safeEqual } from '../lib/adminSession.js'
import { clearAdminCookie, setAdminCookie } from '../lib/cookies.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

/**
 * POST /api/admin/login
 *
 * Request body: { email, password }
 * Success:      200 { ok: true, email }
 *               plus a Set-Cookie header holding the signed session
 * Wrong details: 401
 * Not configured: 503
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const config = adminConfig()

  // If no admin credentials are configured (which happens in production when
  // the environment variables are missing), refuse everyone. Failing closed is
  // much safer than falling back to a default password.
  if (!config.email || !config.password || !config.secret) {
    return res.status(503).json({
      message: 'Admin access has not been configured on this environment.',
    })
  }

  // Both comparisons use the timing-safe helper so that a wrong password
  // cannot be narrowed down by measuring how long the check takes.
  const emailMatches = safeEqual(
    String(email || '').toLowerCase(),
    config.email.toLowerCase()
  )
  const passwordMatches = safeEqual(password || '', config.password)

  // We check both before deciding, rather than returning early, so that a
  // wrong email and a wrong password take the same amount of time.
  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  setAdminCookie(res, createSession(config.email))
  res.json({ ok: true, email: config.email })
})

/**
 * POST /api/admin/logout
 *
 * Deletes the cookie, which signs the user out.
 * Always reports success: signing out twice is not an error worth reporting.
 */
router.post('/logout', (_req, res) => {
  clearAdminCookie(res)
  res.json({ ok: true })
})

/**
 * GET /api/admin/me
 *
 * Protected by `requireAdmin`, so reaching the handler at all means the cookie
 * was valid. The route therefore just confirms who is signed in.
 */
router.get('/me', requireAdmin, (_req, res) => {
  res.json({ authenticated: true, email: adminConfig().email })
})

export default router
