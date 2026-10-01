/**
 * FORMATTING HELPERS
 * ==================
 *
 * WHAT THIS FILE IS
 * Small functions that turn raw data into text a customer can read.
 *
 * WHY `formatMoney` MATTERS MORE THAN IT LOOKS
 * Prices are stored as plain whole numbers, for example 18500. Somewhere in the
 * app that number has to become "₦18,500". If every component did its own
 * formatting, the day someone decides to show kobo or change the currency
 * symbol, they would have to find every single place. Having exactly one
 * function means there is exactly one place to change.
 *
 * `toLocaleString` is what inserts the thousands separators, and it does so
 * according to the visitor's own locale conventions.
 */

/**
 * Format a number as Naira, with thousands separators.
 *
 * @param {number | string} value the amount, e.g. 18500
 * @returns {string} e.g. "₦18,500"
 */
export function formatMoney(value) {
  return `₦${Number(value || 0).toLocaleString()}`
}

/**
 * Format a product's stock level as the badge text used in the admin table.
 *
 * Three bands are used so the shop owner can scan the column quickly:
 *   * "stock-low"  red    — 5 or fewer, reorder soon
 *   * "stock-mid"  amber  — 10 or fewer, worth watching
 *   * "stock-ok"   green  — comfortably in stock
 *
 * @param {number | string} stock the current stock count
 * @returns {{ className: string, label: string }} the CSS class and display text
 */
export function describeStockLevel(stock) {
  const amount = Number(stock)

  if (amount <= 5) {
    return { className: 'stock-low', label: `${amount} units` }
  }

  if (amount <= 10) {
    return { className: 'stock-mid', label: `${amount} units` }
  }

  return { className: 'stock-ok', label: `${amount} units` }
}

/**
 * Turn a date value from the database into a short, readable date.
 *
 * SQLite stores timestamps as text such as "2026-02-14 09:31:00". JavaScript's
 * Date understands that format, so no manual parsing is needed.
 *
 * @param {string} value the stored timestamp
 * @returns {string} e.g. "14/02/2026"
 */
export function formatDate(value) {
  return new Date(value).toLocaleDateString()
}

/**
 * Turn a database timestamp into a date and time.
 *
 * @param {string} value the stored timestamp
 * @returns {string} e.g. "14/02/2026, 09:31:00"
 */
export function formatDateTime(value) {
  return new Date(value).toLocaleString()
}

/**
 * Capitalise the first letter of a word, e.g. "pending" -> "Pending".
 *
 * Used to show order statuses as proper labels while keeping them lowercase in
 * the database and in URLs.
 *
 * @param {string} value
 * @returns {string}
 */
export function capitalise(value) {
  const text = String(value || '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
