/**
 * STOREFRONT HEADER
 * =================
 *
 * WHAT THIS COMPONENT IS
 * The bar at the top of the shop: mobile menu button, the VELOURA logo, the
 * three navigation links, and the Bag button showing how many items are in it.
 *
 * WHY THE ITEM COUNT IS PASSED IN
 * This component only displays the count; it does not own the bag. The bag
 * lives in the `useCart` hook, which is owned by App.jsx. Passing the number
 * down keeps one single source of truth, so the badge can never disagree with
 * what is actually in the drawer.
 *
 * HOW THE MOBILE MENU WORKS
 * The navigation is always present in the markup. On small screens CSS hides
 * it, and adding the `nav-open` class shows it again. Doing it this way means
 * no JavaScript is needed to build a separate mobile menu.
 */

import { Menu, ShoppingBag } from 'lucide-react'

/**
 * @param {object} props
 * @param {number} props.itemCount how many items are in the bag
 * @param {boolean} props.mobileNavOpen whether the small-screen menu is showing
 * @param {() => void} props.onToggleMobileNav
 * @param {() => void} props.onOpenCart
 */
export default function Header({ itemCount, mobileNavOpen, onToggleMobileNav, onOpenCart }) {
  /** Closes the mobile menu after a link is tapped. */
  const closeMobileNav = () => onToggleMobileNav()

  return (
    <header className="header shell">
      <button
        className="icon-button mobile-only"
        onClick={onToggleMobileNav}
        aria-label="Toggle navigation menu"
      >
        <Menu />
      </button>

      <a className="brand" href="#top">
        VELOURA
      </a>

      <nav className={mobileNavOpen ? 'nav nav-open' : 'nav'}>
        <a href="#shop" onClick={closeMobileNav}>
          Shop
        </a>
        <a href="#story" onClick={closeMobileNav}>
          Our Story
        </a>
        <a href="#care" onClick={closeMobileNav}>
          Skin Care
        </a>
      </nav>

      <button className="cart-trigger" onClick={onOpenCart}>
        <ShoppingBag size={20} />
        <span>Bag</span>
        <b>{itemCount}</b>
      </button>
    </header>
  )
}
