/**
 * ADMIN DASHBOARD ROUTE
 * =====================
 *
 * WHAT THIS FILE IS
 * The single endpoint behind the admin overview screen:
 *
 *     GET /api/admin/dashboard
 *
 * It returns four things at once, so the dashboard loads in one request instead
 * of four:
 *
 *   products     counts and totals across the catalogue
 *   orders       counts, revenue, and customer numbers
 *   recentOrders the last six orders, for the table on the left
 *   lowStock     products with 5 units or fewer, for the panel on the right
 *
 * WHY ONE REQUEST INSTEAD OF FOUR
 * Four separate requests would be four round trips to the database and four
 * chances for part of the screen to load while the rest is still blank. One
 * request means the dashboard appears complete or not at all.
 *
 * HOW THE FOUR QUERIES RUN AT THE SAME TIME
 * `Promise.all` starts all four and waits for all of them. Because they are
 * independent reads, none has to wait for another, so the total time is roughly
 * the slowest single query rather than the sum of all four.
 */

import express from 'express'
import db from '../db.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

/**
 * GET /api/admin/dashboard
 *
 * Admin only. Returns the summary numbers and two short lists.
 */
router.get('/', requireAdmin, async (_req, res) => {
  const [productStats, orderStats, recentOrders, lowStock] = await Promise.all([
    // Catalogue totals.
    // COALESCE turns a NULL sum into 0, which happens when the table is empty.
    db.execute(`
      SELECT
        COUNT(*) AS total_products,
        COALESCE(SUM(stock), 0) AS total_units,
        SUM(CASE WHEN stock <= 5 THEN 1 ELSE 0 END) AS low_stock
      FROM products
    `),

    // Sales totals across every recorded order.
    // COUNT(DISTINCT email) counts each customer once, however many times
    // they have ordered.
    db.execute(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(total), 0) AS revenue,
        COUNT(DISTINCT email) AS customers,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
      FROM orders
    `),

    // The six newest orders, for the "Recent orders" table.
    db.execute(`
      SELECT id, order_number, customer_name, total, status, created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 6
    `),

    // Products that need restocking, lowest stock first, capped at eight rows
    // so the panel never grows taller than the table beside it.
    db.execute(`
      SELECT id, name, category, stock, price, image
      FROM products
      WHERE stock <= 5
      ORDER BY stock ASC, name ASC
      LIMIT 8
    `),
  ])

  res.json({
    products: productStats.rows[0],
    orders: orderStats.rows[0],
    recentOrders: recentOrders.rows,
    lowStock: lowStock.rows,
  })
})

export default router
