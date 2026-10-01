/**
 * ADMIN API
 * =========
 *
 * WHAT THIS FILE IS
 * Every call the admin workspace makes to the server, in one place.
 *
 * WHY NOT CALL fetch DIRECTLY IN EACH COMPONENT
 * Three reasons, and each one matters:
 *
 *   1. Every admin request must send the session cookie. The `credentials:
 *      'include'` option below does that. Missing it in one place would
 *      produce a confusing "logged out" bug in just that one screen.
 *
 *   2. Errors need consistent handling. `fetch` does not throw on a 401 or a
 *      500, so we check `response.ok` and throw a real Error with the server's
 *      message.
 *
 *   3. It documents the API. Reading the list of exported functions below tells
 *      you exactly what the admin workspace can do.
 */

/**
 * The shared request helper. Every function below uses it.
 *
 * @param {string} path the endpoint, e.g. "/api/admin/products"
 * @param {RequestInit} [options] standard fetch options
 * @returns {Promise<any>} the parsed response body
 * @throws {Error} with the server's message and a `status` property
 */
async function adminRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  // A response is not guaranteed to contain JSON, so fall back to an empty
  // object rather than letting a parse failure mask the real error.
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(body.message || 'Something went wrong.')
    error.status = response.status
    throw error
  }

  return body
}

/* --- Authentication ------------------------------------------------------ */

/** Sign in. On success the server sets the session cookie. */
export function adminLogin(email, password) {
  return adminRequest('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/** Sign out. The server clears the session cookie. */
export function adminLogout() {
  return adminRequest('/api/admin/logout', { method: 'POST' })
}

/**
 * Ask whether we are still signed in.
 * Throws with status 401 when we are not, which is the signal to show the
 * login screen.
 */
export function adminMe() {
  return adminRequest('/api/admin/me')
}

/* --- Dashboard ----------------------------------------------------------- */

/** Load the summary numbers and the recent-orders / low-stock lists. */
export function fetchDashboard() {
  return adminRequest('/api/admin/dashboard')
}

/* --- Products ------------------------------------------------------------ */

/** List products, optionally filtered. */
export function fetchAdminProducts() {
  return adminRequest('/api/admin/products')
}

/** Create a product. `product` is the plain object from the form. */
export function createProduct(product) {
  return adminRequest('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(product),
  })
}

/** Update an existing product by id. */
export function updateProduct(id, product) {
  return adminRequest(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  })
}

/** Delete a product. Fails with status 409 when it belongs to an order. */
export function deleteProduct(id) {
  return adminRequest(`/api/admin/products/${id}`, { method: 'DELETE' })
}

/* --- Orders -------------------------------------------------------------- */

/** List orders, optionally filtered. */
export function fetchAdminOrders() {
  return adminRequest('/api/admin/orders')
}

/** Fetch one order together with the products it contained. */
export function fetchAdminOrder(id) {
  return adminRequest(`/api/admin/orders/${id}`)
}

/** Move an order to a new status. */
export function updateOrderStatus(id, status) {
  return adminRequest(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
