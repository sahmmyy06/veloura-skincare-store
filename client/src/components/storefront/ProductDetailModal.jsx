/**
 * PRODUCT DETAIL MODAL
 * ====================
 *
 * WHAT THIS COMPONENT IS
 * The popup that opens when a customer clicks a product. It shows the large
 * picture, the full description, the benefits, and the price, with an Add to
 * bag button.
 *
 * HOW THE POPUP CLOSES
 * There are three ways, and each is deliberate:
 *   1. the X button in the corner
 *   2. clicking the dark area behind the popup
 *   3. adding the product to the bag
 *
 * Clicking *inside* the white panel must NOT close it, otherwise the customer
 * would lose their place every time they tried to read the description. That is
 * what the `stopPropagation` call below is for: it stops the click from
 * reaching the backdrop, which is what actually closes the popup.
 */

import { X } from 'lucide-react'
import ProductImage from '../ui/ProductImage.jsx'
import { formatMoney } from '../../lib/format.js'

/**
 * @param {object} props
 * @param {object} props.product the product to show in full
 * @param {() => void} props.onClose
 * @param {(product: object) => void} props.onAdd
 */
export default function ProductDetailModal({ product, onClose, onAdd }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close product details">
          <X />
        </button>

        <ProductImage src={product.image} alt={product.name} />

        <div>
          <p className="product-category">{product.category}</p>

          <h2>{product.name}</h2>

          <p>{product.description}</p>

          {/*
            The benefits field holds a short list of ingredients stored as one
            string, for example "Shea butter • Niacinamide • Vitamin E".
          */}
          <p className="benefits-text">{product.benefits}</p>

          <strong className="modal-price">{formatMoney(product.price)}</strong>

          <button
            className="primary wide"
            onClick={() => {
              onAdd(product)
              onClose()
            }}
          >
            Add to bag
          </button>
        </div>
      </div>
    </div>
  )
}
