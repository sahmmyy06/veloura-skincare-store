/**
 * STOREFRONT PAGE
 * ===============
 *
 * WHAT THIS FILE IS
 * The customer-facing shop. It is the component that owns the page-level state
 * and arranges the sections in order.
 *
 * WHY THIS FILE IS NOW SHORT
 * It used to contain the hero, the catalogue, the cart, the checkout form and
 * three popups all at once, which made it impossible to explain. Each of those
 * now lives in its own file under `components/storefront/`. This file reads as
 * a table of contents for the page, which is exactly what you want when
 * presenting: you can point at each section in turn.
 *
 * WHAT STATE LIVES HERE, AND WHY
 * Only state that is genuinely shared between sections is kept here:
 *
 *   cart / itemCount / subtotal  the bag, shared by the header badge, the
 *                                drawer, and the checkout form
 *   selectedProduct              which product's details are open, if any
 *   cartOpen / checkoutOpen      what the drawer is currently showing
 *   mobileNavOpen                whether the small-screen menu is showing
 *   placedOrder                  the confirmation to show after ordering
 *   orderError / submitting      the state of an in-progress order
 *
 * Everything else, such as the product list and its filters, lives in the
 * `useProducts` hook.
 */

import { useState } from 'react'

import { useCart } from './hooks/useCart.js'
import { useProducts } from './hooks/useProducts.js'
import { createOrder } from './lib/api.js'

import Header from './components/storefront/Header.jsx'
import Hero from './components/storefront/Hero.jsx'
import BenefitStrip from './components/storefront/BenefitStrip.jsx'
import ShopSection from './components/storefront/ShopSection.jsx'
import StorySection from './components/storefront/StorySection.jsx'
import Footer from './components/storefront/Footer.jsx'
import CartDrawer from './components/storefront/CartDrawer.jsx'
import ProductDetailModal from './components/storefront/ProductDetailModal.jsx'
import OrderSuccessModal from './components/storefront/OrderSuccessModal.jsx'

export default function App() {
  const {
    cart,
    itemCount,
    subtotal,
    addToCart,
    changeQuantity,
    clearCart,
  } = useCart()

  const {
    loading,
    error: productsError,
    search,
    setSearch,
    category,
    setCategory,
    visibleProducts,
  } = useProducts()

  // Which product detail popup is open, or null when none is.
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // The successfully placed order, or null while no order has been placed.
  const [placedOrder, setPlacedOrder] = useState(null)

  const [orderError, setOrderError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /**
   * Add a product to the bag from anywhere on the page.
   *
   * It also opens the drawer so the customer gets immediate confirmation that
   * something happened. Without that, adding an item would appear to do
   * nothing at all.
   */
  function handleAddToCart(product) {
    addToCart(product)
    setCartOpen(true)
  }

  /** Close the whole drawer and return it to the bag view. */
  function handleCloseCart() {
    setCartOpen(false)
    setCheckoutOpen(false)
  }

  /**
   * Send the completed checkout form to the server.
   *
   * On success we deliberately do three things in order: record the placed
   * order so the confirmation appears, empty the bag, and close the drawer.
   * The bag is only emptied once the server has confirmed the order, so a
   * failed attempt never loses the customer's items.
   */
  async function handlePlaceOrder(customerDetails) {
    setOrderError('')
    setSubmitting(true)

    try {
      const order = await createOrder(customerDetails, cart)

      setPlacedOrder(order)
      clearCart()
      setCartOpen(false)
      setCheckoutOpen(false)
    } catch (error) {
      setOrderError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="announcement">Free delivery in Lagos on orders over ₦50,000</div>

      <Header
        itemCount={itemCount}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((open) => !open)}
        onOpenCart={() => setCartOpen(true)}
      />

      <main id="top">
        <Hero />
        <BenefitStrip />

        {/*
          A product loading failure would otherwise leave the catalogue area
          blank with no explanation, so it is surfaced here.
        */}
        {productsError ? <p className="empty">{productsError}</p> : null}

        <ShopSection
          visibleProducts={visibleProducts}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          onAdd={handleAddToCart}
          onView={setSelectedProduct}
        />

        <StorySection />
      </main>

      <Footer />

      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddToCart}
        />
      ) : null}

      <CartDrawer
        open={cartOpen}
        checkoutOpen={checkoutOpen}
        cart={cart}
        itemCount={itemCount}
        subtotal={subtotal}
        error={orderError}
        submitting={submitting}
        onClose={handleCloseCart}
        onGoToCheckout={() => setCheckoutOpen(true)}
        onBackToBag={() => setCheckoutOpen(false)}
        onChangeQuantity={changeQuantity}
        onPlaceOrder={handlePlaceOrder}
      />

      {placedOrder ? (
        <OrderSuccessModal
          order={placedOrder}
          onContinueShopping={() => setPlacedOrder(null)}
        />
      ) : null}
    </div>
  )
}
