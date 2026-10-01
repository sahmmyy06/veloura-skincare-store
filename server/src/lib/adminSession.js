/**
 * ADMIN SESSION HELPERS
 * =====================
 *
 * WHAT THIS FILE IS
 * The "who is logged in?" logic for the admin workspace.
 *
 * HOW ADMIN LOGIN WORKS, IN PLAIN ENGLISH
 * We do NOT keep a list of logged-in users in the database. Instead we hand the
 * browser a signed note, and later we check the signature.
 *
 *   1. The owner types the correct email and password.
 *   2. We write a small text string:  "admin@veloura.store|1739999999999"
 *      The second half is the expiry time, 12 hours from now.
 *   3. We sign that string using a secret key that only the server knows.
 *      The signature is a fingerprint of the text. Change one character of the
 *      text and the fingerprint changes completely.
 *   4. We put "text|fingerprint" into a cookie. The cookie is HttpOnly, which
 *      means JavaScript in the browser cannot read it.
 *   5. On every later admin request, the browser sends the cookie back. We
 *      re-calculate the fingerprint and compare. If it matches, and the expiry
 *      has not passed, the request is allowed.
 *
 * WHY THIS IS SAFE
 * An attacker can edit the cookie, but they cannot produce a valid fingerprint
 * without the secret. They cannot change the email or push the expiry date out.
 *
 * WHY IT IS SIMPLE
 * There is no session table to clean up and nothing to lose when the server
 * restarts. The cookie is self-contained.
 *
 * THE ONE THING TO KNOW
 * `ADMIN_SESSION_SECRET` must stay secret. If it leaks, anyone can forge a
 * valid cookie. It is set per environment, never committed to the repository.
 */

import crypto from 'node:crypto'

/** Name of the cookie that holds the admin's signed session note. */
export const ADMIN_COOKIE = 'veloura_admin'

/** How long a login lasts before the admin must sign in again. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

/**
 * Read the admin email, password, and signing secret from the environment.
 *
 * In development we fall back to well-known demo values so the project runs
 * with no setup. In production we deliberately return empty strings instead.
 * Empty values mean login is refused rather than silently using a password
 * that is printed in the README, which would be a serious security hole.
 *
 * @returns {{ email: string, password: string, secret: string }}
 */
export function adminConfig() {
  const isDevelopment = process.env.NODE_ENV !== 'production'

  const email = process.env.ADMIN_EMAIL || (isDevelopment ? 'admin@veloura.store' : '')
  const password = process.env.ADMIN_PASSWORD || (isDevelopment ? 'veloura-admin' : '')
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    (isDevelopment ? 'veloura-dev-secret-change-me' : '')

  return { email, password, secret }
}

/**
 * Compare two strings in a way that does not leak information through timing.
 *
 * WHY NOT JUST USE `===`?
 * A normal string comparison stops at the first differing character. That means
 * it returns very slightly faster for a mostly-wrong guess. An attacker who can
 * measure those tiny differences could, in theory, guess a password one
 * character at a time. `timingSafeEqual` always compares every byte, so the
 * time taken reveals nothing.
 *
 * We check the lengths first because `timingSafeEqual` throws if they differ.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean} true when both values are identical
 */
export function safeEqual(a, b) {
  const bufferA = Buffer.from(String(a))
  const bufferB = Buffer.from(String(b))

  if (bufferA.length !== bufferB.length) {
    return false
  }

  return crypto.timingSafeEqual(bufferA, bufferB)
}

/**
 * Build a signed session token for a given email address.
 *
 * The finished token looks like this before encoding:
 *
 *     admin@veloura.store|1739999999999|9f8c1a...
 *     └── who ──────────┘ └── when ──┘ └─ proof ─┘
 *
 * It is then base64url encoded so it is safe to put in a cookie (base64url
 * avoids the characters `+`, `/`, and `=` that would need escaping).
 *
 * @param {string} email the admin's email address
 * @returns {string} an opaque token to store in the cookie
 */
export function createSession(email) {
  const { secret } = adminConfig()

  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = `${email}|${expiresAt}`
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  return Buffer.from(`${payload}|${signature}`).toString('base64url')
}

/**
 * Check whether a token from a cookie is genuine and still valid.
 *
 * Returns false (rather than throwing) for every failure case, because a bad
 * token is an expected everyday event: cookies expire, people sign out, and
 * the secret can change. Callers only need a yes/no answer.
 *
 * @param {string | undefined} token the raw cookie value
 * @returns {boolean} true when the token is authentic and unexpired
 */
export function verifySession(token) {
  const { email, secret } = adminConfig()

  // If the environment is not configured, nobody can be verified.
  if (!token || !email || !secret) {
    return false
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [sessionEmail, expiresRaw, signature] = decoded.split('|')

    const payload = `${sessionEmail}|${expiresRaw}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    // All three must hold: right person, not expired, untampered proof.
    return (
      sessionEmail === email &&
      Number(expiresRaw) > Date.now() &&
      safeEqual(signature, expectedSignature)
    )
  } catch {
    // A malformed cookie is simply "not logged in".
    return false
  }
}
