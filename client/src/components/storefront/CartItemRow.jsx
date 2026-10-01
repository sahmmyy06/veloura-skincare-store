/**
 * CART ITEM ROW
 * =============
 *
 * WHAT THIS COMPONENT IS
 * One line inside the cart drawer: thumbnail, product name, unit price, the
 * − / quantity / + stepper, and the line total.
 *
 * WHY THE LINE TOTAL IS CALCULATED HERE
 * It is simply `price × quantity` for this one row, which is cheap and keeps
 * the component self-contained. The overall order subtotal is a different
 * matter and lives in the `useCart` hook, because it needs to see every row.
 */

import { Minus, Plus } from 'lucide-react'
import ProductImage from '../ui/ProductImage.jsx'
import { formatMoney } from '../../lib/format.js'

/**
 * @param {object} props
 * @param {object} props.item a cart item, which is a product plus a quantity
 * @param {(id: number, delta: number) => void} props.onChangeQuantity
 */
export default function CartItemRow({ item, onChangeQuantity }) {
  const lineTotal = item.price * item.quantity

  return (
    <div className="cart-row">
      <ProductImage src={item.image} alt="" />

      <div>
        <strong>{item.name}</strong>
        <span>{formatMoney(item.price)}</span>

        <div className="quantity">
          {/*
            Pressing minus when the quantity is 1 removes the item entirely.
            That behaviour lives in `changeQuantity` in useCart, which filters
            out any row that reaches zero.
          */}
          <button
            onClick={() => onChangeQuantity(item.id, -1)}
            aria-label={`Remove one ${item.name}`}
          >
            <Minus size={14} />
          </button>

          <span>{item.quantity}</span>

          <button
            onClick={() => onChangeQuantity(item.id, 1)}
            aria-label={`Add one ${item.name}`}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <b>{formatMoney(lineTotal)}</b>
    </div>
  )
}
