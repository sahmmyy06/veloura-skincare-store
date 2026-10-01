/**
 * ADMIN WORKSPACE — PAGE SHELL
 * ============================
 *
 * WHAT THIS FILE IS
 * The shop-owner application at `/admin`. It decides which screen to show and
 * owns the small amount of state that the screens share.
 *
 * HOW NAVIGATION WORKS (THERE IS NO ROUTER)
 * The URL never changes after the page loads. Instead, `section` is a piece of
 * state holding one of four words:
 *
 *     'dashboard'  'products'  'orders'  'inventory'
 *
 * Clicking a sidebar button changes that word, and the block near the bottom of
 * this file picks the matching screen. That is the entire navigation system,
 * which makes it a good thing to explain out loud when presenting.
 *
 * WHY `dashboard` IS A SEPARATE PIECE OF STATE
 * The dashboard numbers are loaded once and kept here rather than being fetched
 * inside the dashboard component. That way, switching to Products and back does
 * not make the numbers disappear and reload.
 *
 * THE FOUR THINGS THE USER CAN SEE
 *   1. the loading splash, while we ask the server if we are signed in
 *   2. the login screen
 *   3. the dashboard, products, orders, or inventory screen
 *   4. the same, with an error banner if something went wrong
 */

import { useEffect, useState } from 'react'

import './admin.css'

import AdminLogin from './components/AdminLogin.jsx'
import AdminSidebar from './components/AdminSidebar.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import AdminProducts from './components/AdminProducts.jsx'
import AdminOrders from './components/AdminOrders.jsx'

import { useAdminAuth } from './hooks/useAdminAuth.js'
import { fetchDashboard } from './lib/api.js'

export default function AdminApp() {
  const { checking, user, signIn, signOut } = useAdminAuth()

  const [section, setSection] = useState('dashboard')
  const [dashboardData, setDashboardData] = useState(null)
  const [dashboardError, setDashboardError] = useState('')

  /*
   * Load the dashboard numbers whenever the dashboard is shown.
   *
   * Both `user` and `section` are in the dependency list on purpose:
   *   * `user` matters because we must not request admin data before signing in
   *   * `section` matters so the numbers are loaded the first time the
   *     dashboard is opened and refreshed each time the owner returns to it
   */
  useEffect(() => {
    if (!user || section !== 'dashboard') {
      return
    }

    fetchDashboard()
      .then(setDashboardData)
      .catch((error) => setDashboardError(error.message))
  }, [user, section])

  // --- State 1: still asking the server who we are ---
  if (checking) {
    return (
      <div className="admin-splash">
        VELOURA <span>ADMIN</span>
      </div>
    )
  }

  // --- State 2: not signed in ---
  if (!user) {
    return <AdminLogin onSignIn={signIn} />
  }

  // --- States 3 and 4: signed in, showing one of the four screens ---
  let content = <AdminDashboard data={dashboardData} onSelectSection={setSection} />

  if (section === 'products') {
    content = <AdminProducts />
  }

  if (section === 'inventory') {
    content = <AdminProducts inventoryOnly />
  }

  if (section === 'orders') {
    content = <AdminOrders />
  }

  return (
    <div className="admin-shell">
      <AdminSidebar
        section={section}
        onSelectSection={setSection}
        email={user.email}
        onSignOut={signOut}
      />

      <main className="admin-main">
        {dashboardError ? <p className="admin-error">{dashboardError}</p> : null}
        {content}
      </main>
    </div>
  )
}
