/**
 * DATABASE READINESS MIDDLEWARE
 * =============================
 *
 * WHAT THIS FILE IS
 * A guard that runs before every API request and makes sure the database is
 * ready to use.
 *
 * WHY THIS IS NEEDED AT ALL
 * On Vercel the server does not stay running. Each request may wake up a fresh
 * copy of the app. If we created the tables only at startup, the very first
 * request after a quiet period could arrive before the tables existed.
 *
 * So instead we run "make sure the tables exist" before handling the request.
 * `initDatabase()` remembers its own promise after the first successful run,
 * which means:
 *
 *   * the very first request does the real work of creating tables and seeding
 *     the starter products;
 *   * every later request returns the already-finished promise instantly, so
 *     there is no repeated database work.
 *
 * That promise caching is what makes it safe to call this on every request.
 */

import { initDatabase } from '../db.js'

/**
 * Express middleware: ensure the database is ready, or fail with a clear error.
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function ensureDatabaseReady(_req, res, next) {
  try {
    await initDatabase()
    next()
  } catch (error) {
    // Log the real reason for the developer, but tell the browser only that
    // the database is unavailable. Internal details are not useful to a
    // customer and could reveal configuration.
    console.error('Database initialization failed:', error)
    res.status(500).json({ message: 'Database is not ready.' })
  }
}
