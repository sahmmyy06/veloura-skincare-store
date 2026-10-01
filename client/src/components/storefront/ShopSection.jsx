/**
 * SHOP SECTION
 * ============
 *
 * WHAT THIS COMPONENT IS
 * The product catalogue: the section heading, the search box, the category
 * filter pills, and the grid of product cards.
 *
 * WHY THIS IS A SEPARATE COMPONENT
 * This is the busiest part of the storefront. Extracting it keeps App.jsx
 * focused on the overall page, and it means the catalogue can be understood on
 * its own without reading about the cart or the checkout.
 *
 * THE THREE POSSIBLE STATES IT CAN SHOW
 *   1. still loading       -> "Loading products…"
 *   2. products to show    -> the grid of cards
 *   3. nothing matched     -> "No products match your search."
 *
 * Handling all three explicitly is what stops the screen from appearing empty
 * and broken when a customer types a search that matches nothing.
 */

import { Search } from 'lucide-react'
import ProductCard from '../ProductCard.jsx'
import { PRODUCT_CATEGORIES } from '../../lib/constants.js'

/**
 * @param {object} props
 * @param {Array<object>} props.visibleProducts the products to show after filtering
 * @param {boolean} props.loading whether the initial fetch is still running
 * @param {string} props.search the current search text
 * @param {(value: string) => void} props.onSearchChange
 * @param {string} props.category the currently selected category
 * @param {(value: string) => void} props.onCategoryChange
 * @param {(product: object) => void} props.onAdd
 * @param {(product: object) => void} props.onView
 */
export default function ShopSection({
  visibleProducts,
  loading,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onAdd,
  onView,
}) {
  return (
    <section id="shop" className="shop shell">
      <div className="section-heading">
        <div>
          <p className="section-label">The collection</p>
          <h2>Find your everyday favourite.</h2>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search creams..."
          />
        </div>
      </div>

      {/* The category pills. The active one gets the `active` class for styling. */}
      <div className="categories">
        {PRODUCT_CATEGORIES.map((categoryName) => (
          <button
            key={categoryName}
            className={category === categoryName ? 'active' : ''}
            onClick={() => onCategoryChange(categoryName)}
          >
            {categoryName}
          </button>
        ))}
      </div>

      {loading ? <p className="empty">Loading products…</p> : null}

      {!loading && visibleProducts.length > 0 ? (
        <div className="products">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              onView={onView}
            />
          ))}
        </div>
      ) : null}

      {!loading && visibleProducts.length === 0 ? (
        <p className="empty">No products match your search.</p>
      ) : null}
    </section>
  )
}
