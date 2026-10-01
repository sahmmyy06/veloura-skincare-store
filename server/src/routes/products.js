/**
 * PUBLIC PRODUCT ROUTES
 * =====================
 *
 * WHAT THIS FILE IS
 * The two read-only product endpoints that any visitor to the shop can call.
 * No login is required, because browsing the shop is public.
 *
 *     GET /api/products       list products, with optional filters
 *     GET /api/products/:id   fetch one product
 *
 * WHY WE BUILD THE SQL IN PIECES
 * The list endpoint supports three optional filters. There are eight possible
 * combinations of them. Writing eight separate queries would be a maintenance
 * nightmare, so instead we collect `WHERE` conditions and their matching values
 * into two arrays and join them at the end.
 *
 * The important detail is that values are NEVER pasted into the SQL text. They
 * go in the `args` array and are bound by the database driver. That is what
 * stops a malicious search box from rewriting the query, and it is worth saying
 * out loud when presenting.
 */

import express from 'express'
import db from '../db.js'

const router = express.Router()

/**
 * GET /api/products
 *
 * Query parameters (all optional):
 *   ?category=Face Cream   only products in this category ("All" means no filter)
 *   ?search=rose           match against the product name or description
 *   ?featured=true         only products marked as bestsellers
 *
 * Products are returned bestsellers first, then oldest first.
 */
router.get('/', async (req, res) => {
  const { category, search, featured } = req.query

  // `conditions` holds SQL fragments; `args` holds the matching values.
  // They are kept in the same order so the `?` placeholders line up.
  const conditions = []
  const args = []

  if (category && category !== 'All') {
    conditions.push('category = ?')
    args.push(category)
  }

  if (search) {
    // The percent signs make this a "contains" search rather than an exact
    // match, so searching "rose" also finds "Rose Dew Face Cream".
    conditions.push('(name LIKE ? OR description LIKE ?)')
    args.push(`%${search}%`, `%${search}%`)
  }

  if (featured === 'true') {
    conditions.push('featured = 1')
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await db.execute({
    sql: `SELECT * FROM products ${whereClause} ORDER BY featured DESC, id ASC`,
    args,
  })

  res.json(result.rows)
})

/**
 * GET /api/products/:id
 *
 * Fetch a single product by its numeric id.
 * Responds 404 when no product has that id, so the client can show a proper
 * "not found" message instead of rendering an empty card.
 */
router.get('/:id', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM products WHERE id = ?',
    args: [req.params.id],
  })

  const product = result.rows[0]

  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  res.json(product)
})

export default router
