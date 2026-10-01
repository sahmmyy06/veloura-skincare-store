/**
 * useAdminProducts — THE PRODUCT LIST
 * ===================================
 *
 * WHAT THIS HOOK IS
 * Loads the catalogue for the admin Products and Inventory screens, and holds
 * the search text and the "am I showing only low stock?" flag.
 *
 * WHY THE SEARCH IS DONE IN THE BROWSER
 * The whole catalogue is one small list of twenty products. Filtering it here
 * means results appear as the owner types, with no request per keystroke.
 *
 * WHY INVENTORY IS A FILTER RATHER THAN A SEPARATE LIST
 * The Inventory screen is the same table, restricted to products at or below
 * ten units. Reusing one list with a filter avoids a second near-identical
 * component, which is the kind of duplication that drifts apart over time.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAdminProducts } from '../lib/api.js'

/** Inventory counts anything at or below this many units as "needs attention". */
const INVENTORY_STOCK_LIMIT = 10

/**
 * @param {object} [options]
 * @param {boolean} [options.inventoryOnly] true for the Inventory screen
 * @returns {{
 *   products: Array<object>,
 *   loading: boolean,
 *   error: string,
 *   search: string,
 *   setSearch: (value: string) => void,
 *   visibleProducts: Array<object>,
 *   reload: () => Promise<void>,
 * }}
 */
export function useAdminProducts({ inventoryOnly = false } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  /**
   * Fetch the list.
   *
   * Wrapped in `useCallback` so the function keeps the same identity between
   * renders. Without that, putting `reload` in the effect's dependency list
   * below would re-run the effect on every render and loop forever.
   */
  const reload = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setProducts(await fetchAdminProducts())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const visibleProducts = useMemo(() => {
    const searchText = search.toLowerCase()

    return products
      .filter((product) =>
        `${product.name} ${product.category}`.toLowerCase().includes(searchText)
      )
      .filter(
        (product) => !inventoryOnly || Number(product.stock) <= INVENTORY_STOCK_LIMIT
      )
  }, [products, search, inventoryOnly])

  return {
    products,
    loading,
    error,
    search,
    setSearch,
    visibleProducts,
    reload,
  }
}
