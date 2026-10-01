/**
 * PRODUCT HELPERS
 * ===============
 *
 * WHAT THIS FILE IS
 * The rules for what counts as a valid product, and the function that turns a
 * product name into a URL-friendly "slug".
 *
 * WHY VALIDATION LIVES HERE AND NOT IN THE ROUTE
 * Both "create a product" and "edit a product" need exactly the same checks.
 * Keeping them in one place means the rules cannot drift apart, and the route
 * files stay short enough to read in one go.
 */

/**
 * Turn any text into a URL-friendly slug.
 *
 * A slug is the lowercase, hyphenated version of a name that is safe to put in
 * a web address. For example:
 *
 *     "Rose Dew Face Cream"  ->  "rose-dew-face-cream"
 *     "  Cocoa & Silk! "     ->  "cocoa-silk"
 *
 * The steps are: lowercase it, replace every run of non-letter/non-number
 * characters with a single hyphen, then trim hyphens from the ends.
 *
 * @param {unknown} value the text to convert
 * @returns {string} the slug, or an empty string if nothing usable was given
 */
export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Validate an incoming product and return clean, correctly-typed values.
 *
 * WHY THIS EXISTS
 * Data arriving from a browser is untrusted. A price could arrive as the text
 * "abc", stock could be negative, or the whole body could be missing. This
 * function either returns a tidy, safe object or throws an Error whose message
 * is safe to show the shop owner.
 *
 * HOW EDITING WORKS
 * When editing, the browser form may only send the fields that changed. The
 * `existing` argument holds the product as it is stored today, and each field
 * falls back to that stored value. That way a partial update never blanks out
 * a field the owner did not touch.
 *
 * @param {Record<string, unknown>} body the raw request body
 * @param {Record<string, unknown>} [existing] the stored product, when editing
 * @returns {{
 *   name: string, slug: string, category: string, price: number,
 *   description: string, benefits: string, image: string,
 *   stock: number, featured: number
 * }}
 * @throws {Error} with a message meant to be shown to the shop owner
 */
export function normalizeProduct(body, existing = {}) {
  const name = String(body.name ?? existing.name ?? '').trim()
  const category = String(body.category ?? existing.category ?? '').trim()
  const description = String(body.description ?? existing.description ?? '').trim()
  const benefits = String(body.benefits ?? existing.benefits ?? '').trim()

  const price = Number(body.price ?? existing.price ?? 0)
  const stock = Number(body.stock ?? existing.stock ?? 0)

  // The "featured" flag arrives in several shapes depending on whether it came
  // from a real request, a checkbox, or a database row. Normalise it to 0 or 1
  // because that is what SQLite stores.
  const featured =
    body.featured === true || body.featured === 1 || body.featured === '1' ? 1 : 0

  // Prefer a slug the owner typed; otherwise derive one from the name.
  const slug = slugify(body.slug || name || existing.slug)

  // Fall back to the placeholder image so a product is never left with a
  // broken picture in the storefront.
  const image =
    String(body.image ?? existing.image ?? '/products/placeholder.svg').trim() ||
    '/products/placeholder.svg'

  // --- The actual rules ---

  if (!name || !category || !slug || !description || !benefits) {
    throw new Error('Name, category, description and benefits are required.')
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Price must be a valid positive number.')
  }

  // `Number.isInteger` rejects 2.5 units, which is what we want: you cannot
  // stock half a jar of cream.
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('Stock must be a whole number of 0 or more.')
  }

  return { name, slug, category, price, description, benefits, image, stock, featured }
}

/**
 * Turn a database error into a message the shop owner can act on.
 *
 * The most common failure by far is a duplicate slug: two products cannot share
 * the same web address. SQLite reports that with the word "UNIQUE" buried in
 * the error text, so we translate it into plain English.
 *
 * @param {Error} error the error thrown by the database layer
 * @returns {string} a message safe to show a non-technical user
 */
export function describeProductError(error) {
  if (error.message.includes('UNIQUE')) {
    return 'A product with this slug already exists.'
  }

  return error.message
}
