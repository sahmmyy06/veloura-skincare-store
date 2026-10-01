/**
 * ADMIN CONSTANTS
 * ===============
 *
 * WHAT THIS FILE IS
 * Fixed values shared across the admin workspace: the order statuses, the
 * product categories, and the sidebar sections.
 *
 * WHY THE STATUS LIST MATTERS
 * The same five statuses appear in three places: the status dropdown in the
 * order drawer, the filter dropdown above the orders table, and the validation
 * on the server. If they ever disagreed, the interface would offer a status the
 * server rejects. Keeping them defined once, and matching the server's list in
 * `server/src/lib/orders.js`, is what prevents that.
 */

/**
 * The five statuses an order can be in, in the order they normally happen.
 * Cancelled sits last because it is the exception, not part of the happy path.
 */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]

/**
 * The categories a product can be assigned to.
 *
 * These must match the values stored in the database exactly, because the
 * storefront filters by comparing the two directly.
 */
export const PRODUCT_CATEGORIES = [
  'Face Cream',
  'Body Cream',
  'Body Butter',
  'Hand Cream',
]

/**
 * The sidebar navigation entries.
 *
 * Each entry has a `key` used for switching sections, a `label` for display,
 * and an `icon` which is a component from the icon library.
 */
export const ADMIN_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
]

/** Products at or below this many units are counted as low stock. */
export const LOW_STOCK_THRESHOLD = 5
