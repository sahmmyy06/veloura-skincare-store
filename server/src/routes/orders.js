/**
 * PUBLIC ORDER ROUTES
 * ===================
 *
 * WHAT THIS FILE IS
 * The two order endpoints a customer uses from the storefront:
 *
 *     POST /api/orders              place an order at checkout
 *     GET  /api/orders/:orderNumber look up an order by its reference
 *
 * This file holds the single most important piece of business logic in the
 * whole project, so it is commented in more detail than anywhere else.
 *
 * ---------------------------------------------------------------------------
 * WHY PLACING AN ORDER USES A "TRANSACTION"
 * ---------------------------------------------------------------------------
 * Placing an order changes several things at once:
 *
 *   1. a row is inserted into `orders`
 *   2. one row is inserted into `order_items` for each product in the bag
 *   3. the stock count of each product is reduced
 *
 * If the server crashed halfway through, we could end up with an order that
 * was recorded but whose stock was never reduced, and we would happily oversell
 * the same jar of cream to the next customer.
 *
 * A transaction solves this by making the whole group of changes atomic: either
 * every statement succeeds, or none of them are kept. That is exactly what
 * `tx.commit()` and `tx.rollback()` below do. `commit` means "keep everything",
 * `rollback` means "undo everything as if it never happened".
 *
 * ---------------------------------------------------------------------------
 * WHY WE RE-READ THE PRICE FROM THE DATABASE
 * ---------------------------------------------------------------------------
 * The browser sends only a product id and a quantity. It does NOT send the
 * price. If we trusted a price from the browser, anyone could edit the request
 * and buy a ₦20,500 cream for ₦1. Re-reading the price from our own database,
 * inside the transaction, is what makes the total trustworthy.
 */

import express from 'express'
import db from '../db.js'
import { createOrderNumber, looksLikeEmail } from '../lib/orders.js'

const router = express.Router()

/**
 * POST /api/orders
 *
 * Request body:
 *   {
 *     customerName, email, phone, address, city, notes?,
 *     items: [{ id, quantity }, ...]
 *   }
 *
 * On success responds 201 with:
 *   { orderNumber, total, status, message }
 *
 * On a business problem (bad email, not enough stock) responds 400 with a
 * message written for the customer to read.
 */
router.post('/', async (req, res) => {
  const {
    customerName,
    email,
    phone,
    address,
    city,
    notes = '',
    items,
  } = req.body

  // --- Step 1: check the form was filled in at all ---
  const requiredFieldsPresent =
    customerName && email && phone && address && city

  if (!requiredFieldsPresent || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'Please complete the checkout form and add at least one product.',
    })
  }

  if (!looksLikeEmail(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' })
  }

  // --- Step 2: open a write transaction ---
  const transaction = await db.transaction('write')

  try {
    let total = 0

    // `resolvedItems` will hold the trusted product details we read back from
    // the database, paired with the quantity the customer asked for.
    const resolvedItems = []

    // --- Step 3: verify every item BEFORE we write anything ---
    // Doing all the checking first means a problem with the last item does not
    // leave a half-written order behind.
    for (const item of items) {
      const result = await transaction.execute({
        sql: 'SELECT id, name, price, stock FROM products WHERE id = ?',
        args: [item.id],
      })

      const product = result.rows[0]
      const quantity = Number(item.quantity)

      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error('One or more cart items are invalid.')
      }

      if (Number(product.stock) < quantity) {
        // Naming the product makes this message genuinely useful to a customer
        // who has several things in their bag.
        throw new Error(`${product.name} only has ${product.stock} item(s) left.`)
      }

      total += Number(product.price) * quantity
      resolvedItems.push({ ...product, quantity })
    }

    // --- Step 4: write the order row ---
    const orderNumber = createOrderNumber()

    const orderResult = await transaction.execute({
      sql: `INSERT INTO orders
              (order_number, customer_name, email, phone, address, city, notes, total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        orderNumber,
        customerName.trim(),
        // Storing emails in lowercase means "Ada@Example.com" and
        // "ada@example.com" count as the same customer in the dashboard.
        email.trim().toLowerCase(),
        phone.trim(),
        address.trim(),
        city.trim(),
        notes.trim(),
        total,
      ],
    })

    // --- Step 5: write each line item and reduce its stock ---
    for (const item of resolvedItems) {
      await transaction.execute({
        sql: `INSERT INTO order_items
                (order_id, product_id, product_name, price, quantity)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          orderResult.lastInsertRowid,
          item.id,
          item.name,
          // The price is copied onto the line item on purpose. If the shop
          // owner later changes the product's price, this old order must still
          // show what the customer actually paid.
          item.price,
          item.quantity,
        ],
      })

      await transaction.execute({
        sql: 'UPDATE products SET stock = stock - ? WHERE id = ?',
        args: [item.quantity, item.id],
      })
    }

    // --- Step 6: everything worked, so keep it all ---
    await transaction.commit()

    res.status(201).json({
      orderNumber,
      total,
      status: 'pending',
      message: 'Order created successfully.',
    })
  } catch (error) {
    // Any failure at all lands here, and undoes every change made above.
    await transaction.rollback()

    res.status(400).json({ message: error.message || 'Could not create order.' })
  }
})

/**
 * GET /api/orders/:orderNumber
 *
 * Look up a single order by the reference the customer was given, and include
 * the products that were in it.
 *
 * Note this is a different kind of lookup from the admin version: the customer
 * searches by order NUMBER (which they were told), while the admin uses the
 * database id.
 */
router.get('/:orderNumber', async (req, res) => {
  const orderResult = await db.execute({
    sql: 'SELECT * FROM orders WHERE order_number = ?',
    args: [req.params.orderNumber],
  })

  const order = orderResult.rows[0]

  if (!order) {
    return res.status(404).json({ message: 'Order not found' })
  }

  const itemsResult = await db.execute({
    sql: `SELECT product_id, product_name, price, quantity
          FROM order_items
          WHERE order_id = ?`,
    args: [order.id],
  })

  // Spread the order fields and add the items alongside them, so the client
  // receives one flat object: { ...order, items: [...] }.
  res.json({ ...order, items: itemsResult.rows })
})

export default router
