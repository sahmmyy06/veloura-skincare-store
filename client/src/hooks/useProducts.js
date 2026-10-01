/**
 * useProducts — LOADING AND FILTERING THE CATALOGUE
 * =================================================
 *
 * WHAT THIS HOOK IS
 * It fetches the product list once when the page opens, and works out which
 * products should be visible given the current search text and category.
 *
 * WHY FILTERING HAPPENS IN THE BROWSER
 * The shop only has twenty products, so they are all fetched in one request and
 * filtered instantly in the browser. There is no delay while typing in the
 * search box, because nothing is being fetched.
 *
 * This is a deliberate trade-off worth explaining when presenting: with twenty
 * products this is clearly the right choice. With twenty thousand, the
 * filtering would move to the server, where a single request could return just
 * the matching page of results.
 */

import { useEffect, useMemo, useState } from 'react'
import { fetchProducts } from '../lib/api.js'

/**
 * @returns {{
 *   products: Array<object>,
 *   loading: boolean,
 *   error: string,
 *   search: string,
 *   setSearch: (value: string) => void,
 *   category: string,
 *   setCategory: (value: string) => void,
 *   visibleProducts: Array<object>,
 * }}
 */
export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  // The empty array at the end means "run this once, when the page first
  // loads". Without it the request would repeat on every re-render.
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false))
  }, [])

  // `useMemo` means the filtering is only redone when the products, the search
  // text, or the category actually change. React would otherwise repeat the
  // work on every unrelated re-render, such as opening the cart drawer.
  const visibleProducts = useMemo(() => {
    const searchText = search.toLowerCase()

    return products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category

      // Searching checks both the name and the description, so a customer
      // searching for an ingredient can still find the product.
      const searchableText = `${product.name} ${product.description}`.toLowerCase()
      const matchesSearch = searchableText.includes(searchText)

      return matchesCategory && matchesSearch
    })
  }, [products, search, category])

  return {
    products,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    visibleProducts,
  }
}
