/**
 * PRODUCT MODAL — CREATE AND EDIT
 * ===============================
 *
 * WHAT THIS COMPONENT IS
 * The popup form used both to add a new product and to edit an existing one.
 *
 * HOW IT KNOWS WHICH MODE IT IS IN
 * It looks at the `product` prop:
 *
 *   product = {} (or no id)  -> creating a new product
 *   product = { id: 5, ... } -> editing the existing product with id 5
 *
 * That single check drives the title, the button label, which API endpoint is
 * called, and whether the fields are pre-filled. One component handling both
 * keeps the two modes guaranteed to look and behave the same.
 *
 * HOW THE FIELDS ARE PRE-FILLED
 * Each input uses `defaultValue` rather than `value`. This makes them
 * uncontrolled: the browser holds what the owner types and React does not track
 * every keystroke. For a form that is only read when the Save button is pressed,
 * that is both simpler and less code.
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { createProduct, updateProduct } from '../lib/api.js'
import { PRODUCT_CATEGORIES } from '../lib/constants.js'

/**
 * @param {object} props
 * @param {object} props.product the product to edit, or an empty object to create
 * @param {() => void} props.onClose
 * @param {() => void} props.onSaved called after a successful save
 */
export default function ProductModal({ product, onClose, onSaved }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // An existing product always has an id. A new one never does. That is the
  // whole test for which mode we are in.
  const isEditing = Boolean(product?.id)

  /**
   * Validate and send the form.
   *
   * The numeric fields arrive from the browser as text, so they are converted
   * with `Number` before sending. The checkbox arrives as the string "on", so
   * it is converted to a real true/false which the server understands.
   */
  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSaving(true)

    const rawValues = Object.fromEntries(new FormData(event.currentTarget))

    const payload = {
      ...rawValues,
      price: Number(rawValues.price),
      stock: Number(rawValues.stock),
      featured: rawValues.featured === 'on',
    }

    try {
      if (isEditing) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
      }

      onSaved()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      {/*
        `onMouseDown` with `stopPropagation` stops a click inside the panel from
        reaching the backdrop and closing the form. Using `onMouseDown` rather
        than `onClick` matters: if the owner starts a drag inside a text field
        and releases the mouse outside the panel, `onClick` would fire on the
        backdrop and discard their work.
      */}
      <div className="admin-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="admin-modal-head">
          <div>
            <p className="admin-eyebrow">{isEditing ? 'Edit product' : 'New product'}</p>
            <h2>{isEditing ? product.name : 'Add a product'}</h2>
          </div>

          <button onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-product-form">
          <div className="admin-form-grid">
            <label>
              Product name
              <input required name="name" defaultValue={product?.name || ''} />
            </label>

            <label>
              Category
              <select
                required
                name="category"
                defaultValue={product?.category || PRODUCT_CATEGORIES[0]}
              >
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form-grid">
            <label>
              Price (₦)
              <input
                required
                min="0"
                type="number"
                name="price"
                defaultValue={product?.price || ''}
              />
            </label>

            <label>
              Stock
              {/*
                `?? 0` rather than `|| 0` on purpose: a stock of 0 is a real
                value that must be shown as 0, and `||` would treat it as empty.
              */}
              <input
                required
                min="0"
                type="number"
                name="stock"
                defaultValue={product?.stock ?? 0}
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              required
              name="description"
              rows="3"
              defaultValue={product?.description || ''}
            />
          </label>

          <label>
            Key ingredients / benefits
            <textarea
              required
              name="benefits"
              rows="2"
              defaultValue={product?.benefits || ''}
            />
          </label>

          <label>
            Product image URL
            <input
              name="image"
              defaultValue={product?.image || '/products/placeholder.svg'}
              placeholder="/products/product.webp or https://..."
            />
          </label>

          <label className="admin-check">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={Boolean(Number(product?.featured || 0))}
            />
            <span>Feature this product as a bestseller</span>
          </label>

          {error ? <p className="admin-error">{error}</p> : null}

          <div className="admin-form-actions">
            <button type="button" className="admin-secondary" onClick={onClose}>
              Cancel
            </button>

            <button className="admin-primary" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
