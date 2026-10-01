/**
 * ORDER DETAIL DRAWER
 * ===================
 *
 * WHAT THIS COMPONENT IS
 * The panel that slides in from the right when the owner clicks "View" on an
 * order. It shows the customer's contact and delivery details, the items they
 * bought, the total, and a dropdown for changing the order's status.
 *
 * WHY IT FETCHES ITS OWN DATA
 * The orders table only has the summary columns, because loading every line
 * item for every order would be wasteful. This drawer is opened for one order
 * at a time, so it fetches that order's full details on demand, including its
 * items.
 *
 * CHANGING THE STATUS
 * The dropdown calls the API immediately when a new status is chosen. There is
 * no separate Save button, because a status change is a single small decision
 * that the owner should not have to confirm twice.
 */

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Loading } from './AdminUi.jsx'
import { ORDER_STATUSES } from '../lib/constants.js'
import { capitalise, formatDateTime, formatMoney } from '../../lib/format.js'
import { fetchAdminOrder, updateOrderStatus } from '../lib/api.js'

/**
 * @param {object} props
 * @param {number} props.orderId the database id of the order to show
 * @param {() => void} props.onClose
 * @param {() => void} props.onChanged refresh the list behind the drawer
 */
export default function OrderDrawer({ orderId, onClose, onChanged }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  // Re-fetch whenever a different order is opened. `orderId` is in the
  // dependency list so that switching orders while the drawer is open loads the
  // new one instead of showing the previous order's details.
  useEffect(() => {
    fetchAdminOrder(orderId)
      .then(setOrder)
      .catch((requestError) => setError(requestError.message))
  }, [orderId])

  /**
   * Save a new status and update the drawer immediately.
   *
   * The server returns the saved order, which is merged over the current one so
   * the dropdown reflects what was actually stored rather than what was
   * requested.
   */
  async function handleStatusChange(status) {
    try {
      const updated = await updateOrderStatus(orderId, status)

      setOrder((previous) => ({ ...previous, ...updated }))
      onChanged()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="admin-drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="admin-order-drawer"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-head">
          <div>
            <p className="admin-eyebrow">Order details</p>
            <h2>{order ? `#${order.order_number}` : 'Loading…'}</h2>
          </div>

          <button onClick={onClose} aria-label="Close order details">
            <X />
          </button>
        </div>

        {error ? <p className="admin-error">{error}</p> : null}

        {!order && !error ? <Loading /> : null}

        {order ? (
          <div className="admin-order-body">
            <div className="admin-order-summary">
              <div>
                <span>Customer</span>
                <strong>{order.customer_name}</strong>
                <small>
                  {order.email}
                  <br />
                  {order.phone}
                </small>
              </div>

              <div>
                <span>Delivery</span>
                <strong>{order.city}</strong>
                <small>{order.address}</small>
              </div>
            </div>

            <label className="admin-status-select">
              Order status
              <select
                value={order.status}
                onChange={(event) => handleStatusChange(event.target.value)}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {capitalise(status)}
                  </option>
                ))}
              </select>
            </label>

            <h3>Items</h3>

            <div className="admin-order-items">
              {order.items.map((item) => (
                <div key={item.id}>
                  <span>
                    <strong>{item.product_name}</strong>
                    <small>
                      {item.quantity} × {formatMoney(item.price)}
                    </small>
                  </span>

                  {/*
                    The line total is recalculated from the stored price and
                    quantity, so it always matches what the customer actually
                    paid even if the product's price has changed since.
                  */}
                  <b>{formatMoney(Number(item.price) * Number(item.quantity))}</b>
                </div>
              ))}
            </div>

            <div className="admin-order-total">
              <span>Total</span>
              <strong>{formatMoney(order.total)}</strong>
            </div>

            {order.notes ? (
              <div className="admin-note">
                <strong>Order note</strong>
                <p>{order.notes}</p>
              </div>
            ) : null}

            <small className="admin-muted">
              Placed {formatDateTime(order.created_at)}
            </small>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
