/**
 * useAdminOrders — THE ORDER LIST
 * ===============================
 *
 * WHAT THIS HOOK IS
 * Loads the customer orders for the admin Orders screen and holds the search
 * text and the status filter.
 *
 * THE TWO FILTERS COMBINE
 * A search ("ada") and a status ("pending") can be active at the same time, and
 * the list must satisfy both. That is why the two `.filter` calls are chained:
 * the first narrows by text, the second narrows whatever is left by status.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminOrders } from '../lib/api.js'

/**
 * @returns {{
 *   orders: Array<object>,
 *   loading: boolean,
 *   error: string,
 *   search: string,
 *   setSearch: (value: string) => void,
 *   statusFilter: string,
 *   setStatusFilter: (value: string) => void,
 *   visibleOrders: Array<object>,
 *   reload: () => Promise<void>,
 * }}
 */
export function useAdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setOrders(await fetchAdminOrders())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const visibleOrders = useMemo(() => {
    const searchText = search.toLowerCase()

    return orders
      .filter((order) =>
        // Searching across four fields means the owner can find an order by
        // whichever detail the customer gave them on the phone.
        `${order.order_number} ${order.customer_name} ${order.email} ${order.phone}`
          .toLowerCase()
          .includes(searchText)
      )
      .filter((order) => statusFilter === 'All' || order.status === statusFilter)
  }, [orders, search, statusFilter])

  return {
    orders,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    visibleOrders,
    reload,
  }
}
