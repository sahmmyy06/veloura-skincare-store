/**
 * ORDER HELPERS
 * =============
 *
 * WHAT THIS FILE IS
 * Small pieces of logic used when a customer places an order.
 *
 * WHY ORDER NUMBERS ARE GENERATED THIS WAY
 * A customer needs a reference they can read over the phone, and the shop owner
 * needs to be able to tell two orders apart. We combine two things:
 *
 *     VEL-  98012068  -  102
 *     │     │            └── a random 3-digit number
 *     │     └── the last 8 digits of the current time in milliseconds
 *     └── the brand prefix
 *
 * The time part makes the number sort roughly in the order orders arrived. The
 * random part stops two orders placed in the same millisecond from colliding.
 * The database also enforces uniqueness, so a collision would be rejected
 * rather than creating a duplicate.
 */

/** The statuses an order is allowed to be in, in the order they normally occur. */
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]

/**
 * Build a human-friendly, effectively unique order number.
 *
 * @returns {string} something like "VEL-98012068-102"
 */
export function createOrderNumber() {
  const timePart = Date.now().toString().slice(-8)
  const randomPart = Math.floor(100 + Math.random() * 900)

  return `VEL-${timePart}-${randomPart}`
}

/**
 * A very small email sanity check.
 *
 * WHY SO LOOSE?
 * Fully validating an email address with a regular expression is famously
 * impossible to get right, and rejecting a real customer's address is worse
 * than accepting a strange-looking one. This only catches obvious mistakes
 * such as a missing "@" or a missing dot, and the message asks the customer to
 * fix it.
 *
 * @param {string} email
 * @returns {boolean} true when the address is at least plausibly an email
 */
export function looksLikeEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email)
}
