/**
 * ADMIN SIDEBAR
 * =============
 *
 * WHAT THIS COMPONENT IS
 * The fixed navigation column on the left of the admin workspace: the logo, the
 * four section buttons, a link back to the shop, the signed-in user card, and
 * the sign-out button.
 *
 * HOW SECTION SWITCHING WORKS
 * There is no router library. `AdminApp` holds a `section` value in state, and
 * clicking a button here calls `onSelectSection` to change it. That is the
 * whole mechanism, and it is worth saying out loud when presenting because it
 * makes the admin app feel less like a black box.
 *
 * The active button gets the `active` class, which is what makes it look
 * selected.
 */

import {
  Boxes,
  ExternalLink,
  Home,
  LogOut,
  Package,
  ShoppingBag,
} from 'lucide-react'
import { ADMIN_SECTIONS } from '../lib/constants.js'

/**
 * The icon for each section, matched to `ADMIN_SECTIONS` by array position.
 *
 * These are components rather than data values, which is why they are kept
 * here instead of inside the constants file.
 */
const SECTION_ICONS = {
  dashboard: Home,
  products: Package,
  orders: ShoppingBag,
  inventory: Boxes,
}

/**
 * @param {object} props
 * @param {string} props.section the currently visible section key
 * @param {(key: string) => void} props.onSelectSection
 * @param {string} props.email the signed-in admin's email
 * @param {() => void} props.onSignOut
 */
export default function AdminSidebar({ section, onSelectSection, email, onSignOut }) {
  return (
    <aside className="admin-sidebar">
      <a href="/admin" className="admin-brand sidebar-brand">
        VELOURA <small>ADMIN</small>
      </a>

      <nav>
        {ADMIN_SECTIONS.map((item) => {
          const Icon = SECTION_ICONS[item.key]

          return (
            <button
              key={item.key}
              onClick={() => onSelectSection(item.key)}
              className={section === item.key ? 'active' : ''}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="admin-sidebar-bottom">
        {/*
          Opens the shop in a new tab, so the owner does not lose their place
          in the admin workspace while checking what customers see.
        */}
        <a href="/" target="_blank" rel="noreferrer">
          View storefront <ExternalLink size={15} />
        </a>

        <div className="admin-user">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Admin</strong>
            <span>{email}</span>
          </div>
        </div>

        <button className="admin-logout" onClick={onSignOut}>
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </aside>
  )
}
