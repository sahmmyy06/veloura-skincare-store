/**
 * CART STORAGE
 * ============
 *
 * WHAT THIS FILE IS
 * Saving and loading the shopping bag so it survives a page refresh.
 *
 * THE PROBLEM IT SOLVES
 * React state lives in memory. The moment the customer reloads the page, the
 * bag would be empty and they would have to start again. We fix that by writing
 * the bag to the browser's `localStorage`, which keeps data on the customer's
 * own device between visits.
 *
 * WHY THE KEY HAS A BRAND NAME IN IT
 * The key is "veloura-cart". If this code were ever added to a site that
 * already stored a "cart" value, the two would overwrite each other's data.
 * A unique key avoids that.
 *
 * WHY READING IS WRAPPED IN A TRY/CATCH
 * The saved text is not guaranteed to be valid JSON. An older version of the
 * site might have stored a different shape, or the customer might have edited
 * it. `JSON.parse` would throw and the whole page would fail to render. Falling
 * back to an empty bag is a concrete, plausible recovery, which is why the
 * guard is here rather than added defensively everywhere.
 */

const STORAGE_KEY = 'veloura-cart'

/**
 * Read the saved bag from the browser's storage.
 *
 * @returns {Array<object>} the saved cart items, or an empty array when there
 *   is nothing saved or the saved value cannot be understood
 */
export function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return []
    }

    const parsed = JSON.parse(saved)

    // Guard against saved data that is valid JSON but not a list, such as the
    // text "null" or an object left behind by a different version.
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Write the current bag to the browser's storage.
 *
 * A failure here is not worth interrupting the customer for: the bag still
 * works for this visit, it just will not be remembered. Private browsing modes
 * can refuse writes, which is the realistic case this guards.
 *
 * @param {Array<object>} cart the cart items to save
 */
export function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  } catch {
    // Storage unavailable or full. The in-memory cart is unaffected.
  }
}
