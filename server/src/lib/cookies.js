/**
 * COOKIE HELPERS
 * ==============
 *
 * WHAT THIS FILE IS
 * Two small functions that read cookies from a request and write cookies to a
 * response.
 *
 * WHY WE WROTE THESE OURSELVES
 * Express can parse cookies with an extra package, but the admin session uses
 * exactly one cookie. Ten lines of clear code is easier to explain than a
 * dependency, and it keeps the "how login really works" story in one place.
 *
 * THE SHAPE OF A COOKIE HEADER
 * Browsers send cookies as one long string, separated by semicolons:
 *
 *     veloura_admin=abc123; theme=dark; lang=en
 *
 * `parseCookies` turns that into a normal object:
 *
 *     { veloura_admin: 'abc123', theme: 'dark', lang: 'en' }
 */

import { ADMIN_COOKIE } from './adminSession.js'

/** How long a login lasts. Must match the session token lifetime. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

/**
 * Turn a raw `Cookie:` header into a plain object.
 *
 * @param {string} header the raw header, e.g. "a=1; b=2"
 * @returns {Record<string, string>} cookie names mapped to their values
 */
export function parseCookies(header = '') {
  const pairs = header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)

  const cookies = {}

  for (const pair of pairs) {
    // Split on the FIRST `=` only, because a cookie value may itself contain
    // `=` characters that are not separators.
    const separatorIndex = pair.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const name = decodeURIComponent(pair.slice(0, separatorIndex))
    const value = decodeURIComponent(pair.slice(separatorIndex + 1))
    cookies[name] = value
  }

  return cookies
}

/**
 * Attach the admin session cookie to a response so the browser stores it.
 *
 * Each flag on the cookie matters, so they are worth explaining out loud:
 *
 *   Path=/          send this cookie with requests to every page on the site
 *   HttpOnly        JavaScript cannot read it, which blocks a whole class of
 *                   attacks where injected script tries to steal the session
 *   SameSite=Lax    do not send the cookie on requests started by other sites,
 *                   which prevents cross-site request forgery
 *   Secure          only send over HTTPS (production only, because local
 *                   development runs on plain http://localhost)
 *   Max-Age         delete the cookie automatically after 12 hours
 *
 * @param {import('express').Response} res
 * @param {string} token the signed session token
 */
export function setAdminCookie(res, token) {
  // Vercel always serves over HTTPS, so the Secure flag is safe there even
  // when NODE_ENV has not been set explicitly.
  const useSecureFlag = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)

  const cookieValue = [
    `${ADMIN_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ]

  if (useSecureFlag) {
    cookieValue.push('Secure')
  }

  res.setHeader('Set-Cookie', cookieValue.join('; '))
}

/**
 * Tell the browser to throw the admin cookie away, which signs the user out.
 *
 * Setting the same cookie name with `Max-Age=0` is the standard way to delete
 * a cookie: the browser sees an already-expired cookie and removes it.
 *
 * @param {import('express').Response} res
 */
export function clearAdminCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  )
}
