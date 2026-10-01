/**
 * useCart — THE SHOPPING BAG
 * ==========================
 *
 * WHAT THIS HOOK IS
 * All the logic for the shopping bag: what is in it, adding an item, changing a
 * quantity, and the two totals the UI needs.
 *
 * WHY IT IS A HOOK AND NOT PART OF App.jsx
 * The bag is used by four different parts of the page: the product card's Add
 * button, the cart drawer, the checkout form, and the header's item count.
 * Keeping the logic here means the component that renders the drawer does not
 * need to know how the bag is stored, only how to display it.
 *
 * THE MOST IMPORTANT RULE IN THIS FILE
 * The quantity of any item can never go above that product's available stock.
 * The `Math.min` calls below are what enforce that. Without them a customer
 * could add 50 jars of a cream that only has 3 left, and only discover the
 * problem when the order was rejected at checkout.
 */

import { useEffect, useState } from 'react'
import { loadCart, saveCart } from '../lib/cartStorage.js'

/**
 * @returns {{
 *   cart: Array<object>,
 *   itemCount: number,
 *   subtotal: number,
 *   addToCart: (product: object) => void,
 *   changeQuantity: (id: number, delta: number) => void,
 *   clearCart: () => void,
 * }}
 */
export function useCart() {
  // The initial value is read from localStorage. Passing a function to
  // `useState` means this read happens once, on the first render, rather than
  // on every single re-render.
  const [cart, setCart] = useState(loadCart)

  // Whenever the bag changes, save it. This one effect is what makes the bag
  // survive a page refresh, and it covers every way the bag can change.
  useEffect(() => {
    saveCart(cart)
  }, [cart])

  /** The total number of individual items, shown as the badge on the Bag button. */
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  /** The total price of everything in the bag. */
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  /**
   * Add one unit of a product to the bag.
   *
   * If the product is already in the bag its quantity goes up by one; otherwise
   * it is added with a quantity of one. Either way the new quantity is capped
   * at the available stock.
   *
   * @param {object} product the product to add
   */
  function addToCart(product) {
    setCart((previous) => {
      const alreadyInBag = previous.find((item) => item.id === product.id)

      if (alreadyInBag) {
        return previous.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        )
      }

      return [...previous, { ...product, quantity: 1 }]
    })
  }

  /**
   * Increase or decrease the quantity of one item in the bag.
   *
   * `delta` is +1 for the plus button and -1 for the minus button.
   *
   * Two limits are applied:
   *   * `Math.max(0, ...)` stops the quantity going negative
   *   * `Math.min(..., item.stock)` stops it exceeding available stock
   *
   * The `.filter` at the end removes any item that reached zero, which is how
   * the minus button also acts as "remove from bag".
   *
   * @param {number} id the product id
   * @param {number} delta +1 or -1
   */
  function changeQuantity(id, delta) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(0, Math.min(item.quantity + delta, item.stock)),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  /** Empty the bag. Used after an order is placed successfully. */
  function clearCart() {
    setCart([])
  }

  return { cart, itemCount, subtotal, addToCart, changeQuantity, clearCart }
}
