/**
 * ADMIN ORDER ROUTES
 * ==================
 *
 * WHAT THIS FILE IS
 * The three endpoints the shop owner uses to review and progress customer
 * orders. All protected by `requireAdmin`.
 *
 *     GET   /api/admin/orders             list orders (search + status filter)
 *     GET   /api/admin/orders/:id         one order, with its line items
 *     PATCH /api/admin/orders/:id/status  move an order to a new status
 *
 * WHY `PATCH` RATHER THAN `PUT`
 * `PUT` means "replace the whole thing". `PATCH` means "change one part of it".
 * Changing the status touches a single field and leaves the customer's address,
 * total, and items untouched, so `PATCH` describes it accurately.
 */

import express from 'express'
import db from '../db.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { ORDER_STATUSES } from '../lib/orders.js'

const router = express.Router()

/**
 * GET /api/admin/orders
 *
 * Query parameters (all optional):
 *   ?search=ada     match order number, customer name, email, or phone
 *   ?status=pending filter by status ("All" means no filter)
 *
 * Newest first, so the order that just came in is at the top.
 */
router.get('/', requireAdmin, async (req, res) => {
  const search = String(req.query.search || '').trim()
  const status = String(req.query.status || '').trim()

  const conditions = []
  const args = []

  if (search) {
    conditions.push(
      '(order_number LIKE ? OR customer_name LIKE ? OR email LIKE ? OR phone LIKE ?)'
    )
    args.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
  }

  if (status && status !== 'All') {
    // Statuses are stored in lowercase, so a filter of "Pending" still matches.
    conditions.push('status = ?')
    args.push(status.toLowerCase())
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await db.execute({
    sql: `SELECT * FROM orders ${whereClause} ORDER BY id DESC`,
    args,
  })

  res.json(result.rows)
})

/**
 * GET /api/admin/orders/:id
 *
 * One order plus the products it contained.
 *
 * Note this looks up by database `id`, while the public order lookup uses
 * `order_number`. The admin already has the id from the list; the customer
 * only ever knows the reference they were shown.
 */
router.get('/:id', requireAdmin, async (req, res) => {
  const orderResult = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [req.params.id],
  })

  const order = orderResult.rows[0]

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  const itemsResult = await db.execute({
    sql: 'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC',
    args: [order.id],
  })

  res.json({ ...order, items: itemsResult.rows })
})

/**
 * PATCH /api/admin/orders/:id/status
 *
 * Request body: { status: 'confirmed' }
 *
 * The status must be one of the five values in `ORDER_STATUSES`. Anything else
 * is rejected, which keeps typos and stray values out of the database.
 */
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const status = String(req.body?.status || '').toLowerCase()

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status.' })
  }

  const currentResult = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [req.params.id],
  })

  if (!currentResult.rows[0]) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  await db.execute({
    sql: 'UPDATE orders SET status = ? WHERE id = ?',
    args: [status, req.params.id],
  })

  // Return the saved row so the client can update the screen from the real
  // stored data rather than assuming the write matched what it asked for.
  const updated = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [req.params.id],
  })

  res.json(updated.rows[0])
})

export default router
