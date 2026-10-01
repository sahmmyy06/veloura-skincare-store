/**
 * ADMIN PRODUCT ROUTES
 * ====================
 *
 * WHAT THIS FILE IS
 * The four endpoints the shop owner uses to manage the catalogue. Every one is
 * protected by `requireAdmin`, so only a signed-in admin can call them.
 *
 *     GET    /api/admin/products       list products (with search + category)
 *     POST   /api/admin/products       create a product
 *     PUT    /api/admin/products/:id   update a product
 *     DELETE /api/admin/products/:id   delete a product
 *
 * HOW THIS DIFFERS FROM THE PUBLIC PRODUCT ROUTES
 * The storefront version of this list is built for shoppers: bestsellers first,
 * and only the fields a customer needs. This admin version is built for the
 * owner: newest first, everything included, and it can filter on more fields.
 */

import express from 'express'
import db from '../db.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { describeProductError, normalizeProduct } from '../lib/products.js'

const router = express.Router()

/**
 * GET /api/admin/products
 *
 * Query parameters (all optional):
 *   ?search=rose    match name, slug, or description
 *   ?category=...   filter by category ("All" means no filter)
 *
 * Ordered newest first, because the owner usually wants to see what they just
 * added or edited.
 */
router.get('/', requireAdmin, async (req, res) => {
  const search = String(req.query.search || '').trim()
  const category = String(req.query.category || '').trim()

  const conditions = []
  const args = []

  if (search) {
    conditions.push('(name LIKE ? OR slug LIKE ? OR description LIKE ?)')
    args.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  if (category && category !== 'All') {
    conditions.push('category = ?')
    args.push(category)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await db.execute({
    sql: `SELECT * FROM products ${whereClause} ORDER BY id DESC`,
    args,
  })

  res.json(result.rows)
})

/**
 * POST /api/admin/products
 *
 * Create a new product. The body is validated and cleaned by
 * `normalizeProduct`, which throws a readable Error when something is wrong.
 *
 * Responds 201 with the created product, re-read from the database so the
 * client receives the real generated id rather than guessing it.
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const product = normalizeProduct(req.body)

    const result = await db.execute({
      sql: `INSERT INTO products
              (name, slug, category, price, description, benefits, image, stock, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        product.name,
        product.slug,
        product.category,
        product.price,
        product.description,
        product.benefits,
        product.image,
        product.stock,
        product.featured,
      ],
    })

    const created = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [result.lastInsertRowid],
    })

    res.status(201).json(created.rows[0])
  } catch (error) {
    res.status(400).json({ message: describeProductError(error) })
  }
})

/**
 * PUT /api/admin/products/:id
 *
 * Update an existing product.
 *
 * We read the current row first and pass it to `normalizeProduct` as the
 * fallback, so a body containing only the changed fields does not wipe out
 * everything else.
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const currentResult = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [req.params.id],
    })

    const current = currentResult.rows[0]

    if (!current) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const product = normalizeProduct(req.body, current)

    await db.execute({
      sql: `UPDATE products
            SET name = ?, slug = ?, category = ?, price = ?, description = ?,
                benefits = ?, image = ?, stock = ?, featured = ?
            WHERE id = ?`,
      args: [
        product.name,
        product.slug,
        product.category,
        product.price,
        product.description,
        product.benefits,
        product.image,
        product.stock,
        product.featured,
        req.params.id,
      ],
    })

    const updated = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [req.params.id],
    })

    res.json(updated.rows[0])
  } catch (error) {
    res.status(400).json({ message: describeProductError(error) })
  }
})

/**
 * DELETE /api/admin/products/:id
 *
 * Delete a product, but only when it has never been ordered.
 *
 * WHY THIS RULE EXISTS
 * Old orders must stay accurate forever. Each order line stores the product id,
 * so deleting a product that appears in an order would break that order's
 * history. Rather than deleting it, we tell the owner to set its stock to 0,
 * which removes it from sale without damaging past records.
 *
 * The 409 status means "the request was valid, but conflicts with the current
 * state of the data".
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  const linkedResult = await db.execute({
    sql: 'SELECT COUNT(*) AS count FROM order_items WHERE product_id = ?',
    args: [req.params.id],
  })

  const linkedOrderCount = Number(linkedResult.rows[0]?.count || 0)

  if (linkedOrderCount > 0) {
    return res.status(409).json({
      message:
        'This product belongs to an existing order and cannot be deleted. Set stock to 0 instead.',
    })
  }

  await db.execute({
    sql: 'DELETE FROM products WHERE id = ?',
    args: [req.params.id],
  })

  res.json({ ok: true })
})

export default router
