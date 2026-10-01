/**
 * SHARED ADMIN UI PIECES
 * ======================
 *
 * WHAT THIS FILE IS
 * Three small building blocks used on several admin screens.
 *
 * WHY THEY ARE IN ONE FILE
 * Each one is only a few lines, and they are always used together. Splitting
 * three tiny components into three files would add navigation cost without
 * making anything clearer.
 *
 * `formatMoney` is imported from the storefront's format helpers rather than
 * being copied here, so prices are formatted identically in both halves of the
 * site.
 */

import { formatMoney } from '../../lib/format.js'

/**
 * A single white summary tile on the dashboard.
 *
 * @param {object} props
 * @param {import('react').ComponentType} props.icon the icon component to show
 * @param {string} props.label the caption, e.g. "Total orders"
 * @param {string | number} props.value the large number
 * @param {string} [props.hint] optional smaller line under the value
 */
export function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="admin-stat">
      <div className="admin-stat-icon">
        <Icon size={22} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
      </div>
    </article>
  )
}

/**
 * The coloured pill that shows an order's status.
 *
 * The colour comes entirely from CSS: the class name is built from the status
 * itself, so `status-pending`, `status-shipped` and so on are styled in
 * `admin.css`. Adding a new status means adding one CSS rule, not changing any
 * JavaScript.
 *
 * @param {object} props
 * @param {string} props.status e.g. "pending"
 */
export function StatusBadge({ status }) {
  return <span className={`admin-status status-${status}`}>{status}</span>
}

/**
 * The spinner shown while a screen's data is loading.
 *
 * Having one shared component means every admin screen shows the same thing
 * while waiting, instead of each inventing its own placeholder.
 */
export function Loading() {
  return (
    <div className="admin-loading">
      <span></span>
      <p>Loading…</p>
    </div>
  )
}

/**
 * A row of products in the low-stock panel, used on the dashboard.
 *
 * @param {object} props
 * @param {Array<object>} props.products the low-stock products to list
 */
export function LowStockList({ products }) {
  if (products.length === 0) {
    return <div className="admin-success-empty">✓ Stock levels look healthy.</div>
  }

  return (
    <div className="low-stock-list">
      {products.map((product) => (
        <div key={product.id}>
          <ProductThumbnail src={product.image} alt={product.name} />

          <span>
            <strong>{product.name}</strong>
            <small>{product.category}</small>
          </span>

          <b>{product.stock}</b>
        </div>
      ))}
    </div>
  )
}

/**
 * A small product image that falls back to the placeholder when the file is
 * missing. Most seeded product images have not been produced yet, so this
 * happens constantly rather than being a rare edge case.
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} props.alt
 */
export function ProductThumbnail({ src, alt }) {
  /** Swap in the placeholder, but never loop if the placeholder is missing too. */
  function handleError(event) {
    const placeholder = '/products/placeholder.svg'

    if (event.currentTarget.src.endsWith(placeholder)) {
      return
    }

    event.currentTarget.src = placeholder
  }

  return <img src={src} alt={alt} onError={handleError} />
}
