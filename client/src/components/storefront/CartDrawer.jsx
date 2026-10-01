/**
 * CART DRAWER
 * ===========
 *
 * WHAT THIS COMPONENT IS
 * The panel that slides in from the right when the customer opens their bag.
 * It has two modes, controlled by the `checkoutOpen` prop:
 *
 *   bag mode       the list of items, the subtotal, and "Continue to checkout"
 *   checkout mode  the delivery details form
 *
 * WHY BOTH MODES LIVE IN ONE COMPONENT
 * Switching between them only changes what is shown inside the same panel; the
 * panel itself, its heading, and its close button stay put. Splitting them
 * would mean duplicating that frame in two places.
 *
 * THE FOUR STATES OF THE BAG SIDE
 *   1. empty bag       -> a friendly "Your bag is empty" message
 *   2. items in bag    -> the rows, subtotal, and the checkout button
 *   3. checkout form   -> handled by the CheckoutForm component
 *   4. closed          -> the `drawer-open` class is absent, so CSS slides it away
 *
 * HOW THE SLIDE ANIMATION WORKS
 * The panel is always in the page, parked off-screen by CSS. Adding the
 * `drawer-open` class sets `transform: none` and CSS transitions it into view.
 * No JavaScript animation is involved, which keeps this component simple.
 */

import { ShoppingBag, X } from 'lucide-react'
import CartItemRow from './CartItemRow.jsx'
import CheckoutForm from './CheckoutForm.jsx'
import { formatMoney } from '../../lib/format.js'

/**
 * @param {object} props
 * @param {boolean} props.open whether the drawer is visible
 * @param {boolean} props.checkoutOpen true to show the delivery form instead of the bag
 * @param {Array<object>} props.cart the bag contents
 * @param {number} props.itemCount total number of items
 * @param {number} props.subtotal total price of the bag
 * @param {string} props.error a message from a failed order attempt
 * @param {boolean} props.submitting true while an order is being placed
 * @param {() => void} props.onClose
 * @param {() => void} props.onGoToCheckout
 * @param {() => void} props.onBackToBag
 * @param {(id: number, delta: number) => void} props.onChangeQuantity
 * @param {(customerDetails: object) => void} props.onPlaceOrder
 */
export default function CartDrawer({
  open,
  checkoutOpen,
  cart,
  itemCount,
  subtotal,
  error,
  submitting,
  onClose,
  onGoToCheckout,
  onBackToBag,
  onChangeQuantity,
  onPlaceOrder,
}) {
  const bagIsEmpty = cart.length === 0

  return (
    <>
      <aside className={open ? 'drawer drawer-open' : 'drawer'}>
        <div className="drawer-head">
          <h2>
            Your bag <span>{itemCount}</span>
          </h2>

          <button className="icon-button" onClick={onClose} aria-label="Close bag">
            <X />
          </button>
        </div>

        {checkoutOpen ? (
          <CheckoutForm
            total={subtotal}
            error={error}
            submitting={submitting}
            onBack={onBackToBag}
            onSubmit={onPlaceOrder}
          />
        ) : (
          <>
            {bagIsEmpty ? (
              <div className="empty-cart">
                <ShoppingBag size={38} />
                <h3>Your bag is empty</h3>
                <p>Add a little self-care.</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      onChangeQuantity={onChangeQuantity}
                    />
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{formatMoney(subtotal)}</strong>
                  </div>

                  {/*
                    The delivery fee is deliberately not invented here. The shop
                    confirms it after reviewing the address, so promising a
                    number now would be misleading.
                  */}
                  <p>Delivery fee is confirmed after your address is reviewed.</p>

                  <button className="primary wide" onClick={onGoToCheckout}>
                    Continue to checkout
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </aside>

      {/*
        The dimmed layer behind the drawer. It is a button so that it is
        reachable by keyboard, which a plain <div> would not be.
      */}
      {open ? (
        <button
          className="drawer-overlay"
          onClick={onClose}
          aria-label="Close bag"
        />
      ) : null}
    </>
  )
}
