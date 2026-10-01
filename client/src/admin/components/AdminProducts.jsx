/**
 * ADMIN PRODUCTS SCREEN
 * =====================
 *
 * WHAT THIS COMPONENT IS
 * The catalogue table. It is used twice:
 *
 *   Products   the full catalogue, with Add, Edit and Delete
 *   Inventory  the same table limited to products at or below ten units, with
 *              Edit but no Delete, because stock management is the focus there
 *
 * The `inventoryOnly` prop decides which of the two the owner is looking at.
 * Reusing one table means the two screens can never disagree about what a
 * product looks like.
 *
 * THE ONE DESTRUCTIVE ACTION
 * Deleting asks for confirmation first, because it cannot be undone. The server
 * also refuses to delete any product that appears in an existing order, so the
 * worst case is a clear explanation rather than lost order history.
 */

import { useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import ProductModal from './ProductModal.jsx'
import { Loading, ProductThumbnail } from './AdminUi.jsx'
import { useAdminProducts } from '../hooks/useAdminProducts.js'
import { describeStockLevel, formatMoney } from '../../lib/format.js'
import { deleteProduct } from '../lib/api.js'

/**
 * @param {object} props
 * @param {boolean} [props.inventoryOnly] true for the Inventory screen
 */
export default function AdminProducts({ inventoryOnly = false }) {
  const { loading, error, search, setSearch, visibleProducts, reload } =
    useAdminProducts({ inventoryOnly })

  // `null` means the modal is closed. `{}` means "create new". A product object
  // means "edit this one".
  const [modalProduct, setModalProduct] = useState(null)

  /** Ask for confirmation, then delete the product and refresh the list. */
  async function handleDelete(product) {
    const confirmed = window.confirm(`Delete ${product.name}?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteProduct(product.id)
      await reload()
    } catch (deleteError) {
      // The most likely message here is the server's explanation that the
      // product belongs to an order and must not be deleted.
      window.alert(deleteError.message)
    }
  }

  const heading = inventoryOnly ? 'Stock management' : 'Products'
  const subheading = inventoryOnly
    ? 'Focus on low and medium stock levels.'
    : 'Create and manage every product in the storefront.'

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">{inventoryOnly ? 'Inventory' : 'Catalog'}</p>
          <h1>{heading}</h1>
          <p>{subheading}</p>
        </div>

        {/* Adding is only offered on the Products screen, not Inventory. */}
        {!inventoryOnly ? (
          <button className="admin-primary" onClick={() => setModalProduct({})}>
            <Plus size={17} /> Add product
          </button>
        ) : null}
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
          />
        </div>

        <span>
          {visibleProducts.length} product{visibleProducts.length === 1 ? '' : 's'}
        </span>
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
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {visibleProducts.map((product) => {
                  const stock = describeStockLevel(product.stock)

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          <ProductThumbnail src={product.image} alt={product.name} />
                          <span>
                            <strong>{product.name}</strong>
                            <small>{product.slug}</small>
                          </span>
                        </div>
                      </td>

                      <td>{product.category}</td>

                      <td>{formatMoney(product.price)}</td>

                      <td>
                        {/* The colour of this text is set by the class name. */}
                        <span className={stock.className}>{stock.label}</span>
                      </td>

                      <td>{Number(product.featured) ? 'Yes' : '—'}</td>

                      <td>
                        <div className="admin-row-actions">
                          <button
                            title="Edit"
                            onClick={() => setModalProduct(product)}
                          >
                            <Pencil size={16} />
                          </button>

                          {!inventoryOnly ? (
                            <button
                              className="danger"
                              title="Delete"
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalProduct ? (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onSaved={() => {
            setModalProduct(null)
            reload()
          }}
        />
      ) : null}
    </>
  )
}
