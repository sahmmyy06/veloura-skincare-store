/**
 * ADMIN ORDERS SCREEN
 * ===================
 *
 * WHAT THIS COMPONENT IS
 * The orders table: a search box, a status filter, and one row per order. Each
 * row has a "View" button that opens the order detail drawer.
 *
 * WHAT IT DOES NOT DO
 * It does not fetch the order's items, and it does not change statuses. Both of
 * those happen inside `OrderDrawer`, which loads full details for the one order
 * being looked at. That split is deliberate: the table stays a lightweight list
 * of summaries, however many orders the shop accumulates.
 */

import { useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import OrderDrawer from './OrderDrawer.jsx'
import { Loading, StatusBadge } from './AdminUi.jsx'
import { ORDER_STATUSES } from '../lib/constants.js'
import { capitalise, formatDate, formatMoney } from '../../lib/format.js'
import { useAdminOrders } from '../hooks/useAdminOrders.js'

export default function AdminOrders() {
  const {
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    visibleOrders,
    reload,
  } = useAdminOrders()

  // The id of the order whose drawer is open, or null when it is closed.
  const [openOrderId, setOpenOrderId] = useState(null)

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Orders</p>
          <h1>Customer orders</h1>
          <p>Track, review and update every order from checkout to delivery.</p>
        </div>
      </div>

      <div className="admin-toolbar orders-toolbar">
        <div className="admin-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, customer, email..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option>All</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {capitalise(status)}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      <section className="admin-panel admin-list-panel">
        {loading ? (
          <Loading />
        ) : (
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {visibleOrders.length > 0 ? (
                  visibleOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <b>#{order.order_number}</b>
                      </td>

                      <td>{order.customer_name}</td>

                      <td>
                        <small>
                          {order.email}
                          <br />
                          {order.phone}
                        </small>
                      </td>

                      <td>{formatMoney(order.total)}</td>

                      <td>
                        <StatusBadge status={order.status} />
                      </td>

                      <td>{formatDate(order.created_at)}</td>

                      <td>
                        <button
                          className="admin-view-button"
                          onClick={() => setOpenOrderId(order.id)}
                        >
                          View <ChevronRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="admin-empty-cell">
                      No orders match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openOrderId ? (
        <OrderDrawer
          orderId={openOrderId}
          onClose={() => setOpenOrderId(null)}
          onChanged={reload}
        />
      ) : null}
    </>
  )
}
