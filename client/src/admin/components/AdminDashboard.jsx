/**
 * ADMIN DASHBOARD
 * ===============
 *
 * WHAT THIS COMPONENT IS
 * The landing screen after signing in. It shows four summary tiles, a table of
 * the six most recent orders, and a panel of products running low on stock.
 *
 * HOW IT GETS ITS DATA
 * The data is fetched by `AdminApp` and passed in as the `data` prop, because
 * the same request is also needed to decide whether the screen is ready. This
 * component only displays it.
 *
 * THE FOUR TILES, AND WHERE THE NUMBERS COME FROM
 *   Total orders  data.orders.total_orders
 *   Revenue       data.orders.revenue
 *   Customers     data.orders.customers   (unique email addresses)
 *   Products      data.products.total_products
 *
 * All of these are computed by SQL on the server, in
 * `server/src/routes/adminDashboard.js`. Nothing is counted in the browser.
 */

import { ChevronRight, CircleDollarSign, ClipboardList, Package, Plus, Users } from 'lucide-react'
import { Loading, LowStockList, StatCard, StatusBadge } from './AdminUi.jsx'
import { formatDate, formatMoney } from '../../lib/format.js'

/**
 * @param {object} props
 * @param {object | null} props.data the dashboard payload, or null while loading
 * @param {(section: string) => void} props.onSelectSection
 */
export default function AdminDashboard({ data, onSelectSection }) {
  // Nothing has arrived yet, so show the spinner rather than a screen full of
  // zeros, which would look like a shop with no sales.
  if (!data) {
    return <Loading />
  }

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Overview</p>
          <h1>Store dashboard</h1>
          <p>Here’s what’s happening with Veloura right now.</p>
        </div>

        <button
          className="admin-secondary"
          onClick={() => onSelectSection('products')}
        >
          <Plus size={17} /> Add product
        </button>
      </div>

      <div className="admin-stats">
        <StatCard
          icon={ClipboardList}
          label="Total orders"
          value={Number(data.orders.total_orders || 0).toLocaleString()}
          hint={`${data.orders.pending || 0} pending`}
        />

        <StatCard
          icon={CircleDollarSign}
          label="Revenue"
          value={formatMoney(data.orders.revenue)}
          hint="All recorded orders"
        />

        <StatCard
          icon={Users}
          label="Customers"
          value={Number(data.orders.customers || 0).toLocaleString()}
          hint="Unique customer emails"
        />

        <StatCard
          icon={Package}
          label="Products"
          value={Number(data.products.total_products || 0).toLocaleString()}
          hint={`${data.products.total_units || 0} units in stock`}
        />
      </div>

      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <div>
              <h2>Recent orders</h2>
              <p>Latest purchases placed through the store.</p>
            </div>

            <button onClick={() => onSelectSection('orders')}>
              View all <ChevronRight size={15} />
            </button>
          </div>

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <b>#{order.order_number}</b>
                      </td>
                      <td>{order.customer_name}</td>
                      <td>{formatMoney(order.total)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    {/*
                      colSpan makes this single cell stretch across all five
                      columns, so the message is centred under the headers.
                    */}
                    <td colSpan="5" className="admin-empty-cell">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Low stock</h2>
              <p>Products at 5 units or below.</p>
            </div>

            <button onClick={() => onSelectSection('inventory')}>View inventory</button>
          </div>

          <LowStockList products={data.lowStock} />
        </section>
      </div>
    </>
  )
}
