/**
 * ADMIN AUTHENTICATION GUARD
 * ==========================
 *
 * WHAT THIS FILE IS
 * The middleware that protects every `/api/admin/*` endpoint except login.
 *
 * HOW IT IS USED
 * In a route file you list it before the handler:
 *
 *     router.get('/products', requireAdmin, async (req, res) => { ... })
 *
 * Express runs middleware left to right. If `requireAdmin` does not call
 * `next()`, the handler never runs. That single line is what makes an endpoint
 * private, which is a nice thing to point out when presenting: security is not
 * scattered through the code, it is one clearly-named gate in front.
 *
 * WHERE THE OFFICIAL ANSWER COMES FROM
 * Nothing here re-implements the signature check. It reads the cookie and asks
 * `verifySession` in `lib/adminSession.js`. One place decides whether a session
 * is valid, so login and the guard can never disagree.
 */

import { parseCookies } from '../lib/cookies.js'
import { ADMIN_COOKIE, verifySession } from '../lib/adminSession.js'

/**
 * Allow the request through only when it carries a valid admin session cookie.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAdmin(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || '')
  const token = cookies[ADMIN_COOKIE]

  if (!verifySession(token)) {
    // 401 means "you are not authenticated". The client uses this exact code
    // to decide it should show the login screen instead of the dashboard.
    return res.status(401).json({ message: 'Admin authentication required.' })
  }

  next()
}
