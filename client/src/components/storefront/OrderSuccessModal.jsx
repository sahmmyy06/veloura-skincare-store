/**
 * ORDER SUCCESS MODAL
 * ===================
 *
 * WHAT THIS COMPONENT IS
 * The confirmation popup shown after an order has been placed successfully.
 * It shows the order reference and the total.
 *
 * WHY THE ORDER NUMBER IS SHOWN SO PROMINENTLY
 * It is the only way the customer can refer to this order later. The backend
 * can look an order up by its number, so displaying it clearly, and in bold, is
 * a genuine courtesy rather than decoration.
 *
 * WHY THERE IS NO CLOSE X
 * At this point the order is already placed and the bag has been emptied.
 * "Continue shopping" is the only sensible next step, so offering one clear
 * button avoids any confusion about whether the order went through.
 */

import { formatMoney } from '../../lib/format.js'

/**
 * @param {object} props
 * @param {{ orderNumber: string, total: number }} props.order the created order
 * @param {() => void} props.onContinueShopping
 */
export default function OrderSuccessModal({ order, onContinueShopping }) {
  return (
    <div className="modal-backdrop">
      <div className="success-modal">
        <div className="success-icon">✓</div>

        <h2>Order received</h2>

        <p>
          Thank you. Your order number is <strong>{order.orderNumber}</strong>.
        </p>

        <p>
          Total: <strong>{formatMoney(order.total)}</strong>
        </p>

        <button className="primary wide" onClick={onContinueShopping}>
          Continue shopping
        </button>
      </div>
    </div>
  )
}
