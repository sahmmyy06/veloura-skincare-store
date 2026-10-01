/**
 * PRODUCT CARD
 * ============
 *
 * WHAT THIS COMPONENT IS
 * One product tile in the shop grid: picture, category, name, short
 * description, price, and an Add button.
 *
 * HOW IT COMMUNICATES WITH THE REST OF THE PAGE
 * This component is deliberately simple: it holds no state of its own and knows
 * nothing about the shopping bag. It receives two callbacks from App.jsx:
 *
 *   onView(product)  the customer wants to see the full details
 *   onAdd(product)   the customer wants to put it in the bag
 *
 * Keeping it this way means the card can be reused anywhere (a related-products
 * row, a wishlist, a search results page) without dragging cart logic along.
 *
 * THE SOLD OUT STATE
 * When stock is zero the Add button is disabled and its label changes. This
 * matters because the alternative is letting a customer add an unavailable item
 * and only discovering the problem at checkout.
 */

import { Plus } from 'lucide-react'
import ProductImage from './ui/ProductImage.jsx'
import { formatMoney } from '../lib/format.js'

/**
 * @param {object} props
 * @param {object} props.product the product to display
 * @param {(product: object) => void} props.onAdd
 * @param {(product: object) => void} props.onView
 */
export default function ProductCard({ product, onAdd, onView }) {
  const isSoldOut = product.stock < 1

  return (
    <article className="product-card">
      {/*
        The whole image is a button that opens the product details. The
        aria-label spells out what the button does, because "View" alone would
        not tell a screen reader user which product it refers to.
      */}
      <button
        className="product-image"
        onClick={() => onView(product)}
        aria-label={`View ${product.name}`}
      >
        <ProductImage src={product.image} alt={product.name} lazy />

        {/* Only bestsellers get the tag. `null` renders nothing at all. */}
        {product.featured ? <span className="tag">Bestseller</span> : null}
      </button>

      <div className="product-copy">
        <p className="product-category">{product.category}</p>

        <button className="product-title" onClick={() => onView(product)}>
          {product.name}
        </button>

        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <strong>{formatMoney(product.price)}</strong>

          <button
            className="add-button"
            onClick={() => onAdd(product)}
            disabled={isSoldOut}
          >
            <Plus size={17} />
            {isSoldOut ? 'Sold out' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  )
}
