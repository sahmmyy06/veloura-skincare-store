/**
 * API CLIENT
 * ==========
 *
 * WHAT THIS FILE IS
 * The single place where the frontend talks to the backend.
 *
 * WHY EVERY CALL GOES THROUGH HERE
 * Every request to the API needs the same three things:
 *
 *   1. the JSON content type header
 *   2. `credentials: 'include'`, so the admin session cookie is sent
 *   3. consistent error handling
 *
 * If each component called `fetch` directly, that logic would be repeated
 * everywhere and would slowly drift apart. One function means one behaviour.
 *
 * THE ERROR HANDLING CONTRACT
 * `fetch` does NOT throw when the server responds with 404 or 500. It only
 * throws when the network itself fails. That surprises almost everyone, so
 * this wrapper checks `response.ok` and turns any failure status into a real
 * thrown Error. Callers can then use an ordinary try/catch.
 */

/**
 * Call the API and return the parsed JSON body.
 *
 * @param {string} path the endpoint, e.g. "/api/products"
 * @param {RequestInit} [options] standard fetch options
 * @returns {Promise<any>} the parsed response body
 * @throws {Error} with the server's message and a `status` property
 */
export async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  // A response body is not guaranteed. An empty 204, or an HTML error page
  // from a proxy, would make `response.json()` throw. Falling back to an empty
  // object keeps the error message below meaningful.
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(body.message || 'Something went wrong.')

    // Keeping the status code lets callers react differently to specific
    // cases. The admin app checks for 401 to decide it should show the login
    // screen, while other failures just show a message.
    error.status = response.status
    throw error
  }

  return body
}

/**
 * Fetch the list of products for the storefront.
 *
 * @returns {Promise<Array<object>>}
 */
export function fetchProducts() {
  return apiRequest('/api/products')
}

/**
 * Send a completed checkout form to the server to create an order.
 *
 * Notice what is sent: only product ids and quantities. Prices are deliberately
 * left out, because the server looks them up itself so a customer cannot edit
 * the request and choose their own price.
 *
 * @param {object} customerDetails the delivery details from the form
 * @param {Array<{ id: number, quantity: number }>} items the bag contents
 * @returns {Promise<{ orderNumber: string, total: number, status: string }>}
 */
export function createOrder(customerDetails, items) {
  return apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customerName: customerDetails.customerName,
      email: customerDetails.email,
      phone: customerDetails.phone,
      address: customerDetails.address,
      city: customerDetails.city,
      notes: customerDetails.notes,
      items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
    }),
  })
}
