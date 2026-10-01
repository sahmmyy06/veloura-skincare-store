/**
 * DATABASE CONNECTION AND SCHEMA
 * ==============================
 *
 * WHAT THIS FILE IS
 * Everything about the database lives here:
 *
 *   1. the connection to it
 *   2. the three tables, created on first use
 *   3. the twenty starter products
 *   4. `initDatabase()`, the function that sets all of that up once
 *
 * WHICH DATABASE IS USED
 * There are two possibilities, chosen automatically:
 *
 *   Local development  `file:./server/data/veloura.db`, a single file on disk.
 *   Production         Turso, a hosted SQLite service, when TURSO_DATABASE_URL
 *                      is set.
 *
 * Both speak the same SQL, so no code below has to care which one is in use.
 * That is the whole benefit of using libSQL (the library used here) rather than
 * a different database for each environment.
 *
 * THE THREE TABLES
 *   products     the catalogue
 *   orders       one row per order, with the customer's delivery details
 *   order_items  one row per product inside an order
 *
 * WHY THERE IS A SEPARATE order_items TABLE
 * An order can contain several products. Squeezing them into one row would mean
 * storing a list inside a single column, which SQL cannot search or total
 * properly. A separate table keeps every row simple and makes questions like
 * "how many times has this product been ordered?" a single query.
 *
 * WHY ORDER ITEMS STORE A COPY OF THE NAME AND PRICE
 * If the shop owner later renames a product or changes its price, past orders
 * must still show what the customer actually bought at the price they actually
 * paid. Copying those two values onto the line item is what makes old invoices
 * trustworthy.
 */

import { createClient } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production'

// A warning rather than a crash. The site can still be browsed; it just cannot
// save anything durable. Failing to start at all would be worse.
if (isProduction && !process.env.TURSO_DATABASE_URL) {
  console.warn(
    'TURSO_DATABASE_URL is not set. Production writes will not be durable until Turso is connected.'
  )
}

/**
 * Work out where the local database file should live.
 *
 * WHY THIS IS NOT JUST A RELATIVE PATH
 * The obvious choice would be `file:./server/data/veloura.db`. That path is
 * resolved relative to whichever folder the server was started from, which
 * breaks in a way that is genuinely confusing:
 *
 *   started from the project root  ->  ./server/data/veloura.db        correct
 *   started from the server folder ->  ./server/server/data/veloura.db  wrong
 *
 * The second case happens with `npm run dev`, because npm runs a package's
 * script with that package's folder as the working directory. The database
 * then fails to open and the API reports "Database is not ready."
 *
 * Building the path from this file's own location instead makes it correct no
 * matter where the server is started from.
 *
 * We also create the folder if it is missing, so a fresh clone works without
 * the manual `mkdir` step.
 */
function localDatabaseUrl() {
  // `import.meta.url` is this file's address. Walking up two folders
  // (server/src -> server) gives the server folder, then into `data`.
  const serverFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const dataFolder = path.join(serverFolder, 'data')

  mkdirSync(dataFolder, { recursive: true })

  return `file:${path.join(dataFolder, 'veloura.db')}`
}

/**
 * The shared database connection.
 *
 * Every route file imports this one object, so there is a single connection
 * rather than a new one per request.
 */
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || localDatabaseUrl(),
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
})

/**
 * The twenty products that exist the first time the site runs.
 *
 * WHY THESE ARE STORED AS PLAIN OBJECTS
 * Each product is written out field by field with its name beside its value.
 * That is longer than a compact list of values, but it means anyone reading
 * this file can see exactly what a product is made of without counting commas
 * or remembering which position holds the price.
 *
 * These are inserted ONLY when the products table is completely empty, so the
 * shop owner can freely edit or delete them without them reappearing.
 */
const seedProducts = [
  {
    name: 'Radiance Glow Body Cream',
    slug: 'radiance-glow-body-cream',
    category: 'Body Cream',
    price: 18500,
    description:
      'A rich daily moisturizer that softens dry skin and leaves a luminous, non-greasy finish.',
    benefits: 'Shea butter • Niacinamide • Vitamin E',
    image: '/products/01-radiance-glow-body-cream.webp',
    stock: 18,
    featured: 1,
  },
  {
    name: 'Rose Dew Face Cream',
    slug: 'rose-dew-face-cream',
    category: 'Face Cream',
    price: 14500,
    description:
      'A lightweight face cream for soft, balanced-looking skin with a smooth finish.',
    benefits: 'Rose water • Squalane • Hyaluronic acid',
    image: '/products/02-rose-dew-face-cream.webp',
    stock: 24,
    featured: 1,
  },
  {
    name: 'Cocoa Silk Body Butter',
    slug: 'cocoa-silk-body-butter',
    category: 'Body Butter',
    price: 16800,
    description:
      'Deep nourishment for elbows, knees and very dry areas, with a velvety cocoa scent.',
    benefits: 'Cocoa butter • Shea butter • Jojoba oil',
    image: '/products/03-cocoa-silk-body-butter.webp',
    stock: 15,
    featured: 1,
  },
  {
    name: 'Soft Hands Repair Cream',
    slug: 'soft-hands-repair-cream',
    category: 'Hand Cream',
    price: 8500,
    description:
      'A compact moisture-rich cream for hands exposed to frequent washing and dry weather.',
    benefits: 'Glycerin • Panthenol • Ceramides',
    image: '/products/04-soft-hands-repair-cream.webp',
    stock: 30,
    featured: 0,
  },
  {
    name: 'Even Tone Night Cream',
    slug: 'even-tone-night-cream',
    category: 'Face Cream',
    price: 17200,
    description:
      'A calming night moisturizer designed to support a more even-looking complexion over time.',
    benefits: 'Niacinamide • Licorice root • Ceramides',
    image: '/products/05-even-tone-night-cream.webp',
    stock: 20,
    featured: 1,
  },
  {
    name: 'Vanilla Cloud Body Lotion',
    slug: 'vanilla-cloud-body-lotion',
    category: 'Body Cream',
    price: 12800,
    description:
      'A light everyday lotion with a soft vanilla finish for comfortable, hydrated skin.',
    benefits: 'Aloe vera • Vitamin E • Sweet almond oil',
    image: '/products/06-vanilla-cloud-body-lotion.webp',
    stock: 28,
    featured: 0,
  },
  {
    name: 'Peptide Plump Face Cream',
    slug: 'peptide-plump-face-cream',
    category: 'Face Cream',
    price: 19500,
    description:
      'A cushiony moisturizer that supports a plump, supple look without feeling heavy.',
    benefits: 'Peptides • Squalane • Hyaluronic acid',
    image: '/products/07-peptide-plump-face-cream.webp',
    stock: 17,
    featured: 1,
  },
  {
    name: 'Mango Melt Body Butter',
    slug: 'mango-melt-body-butter',
    category: 'Body Butter',
    price: 15800,
    description:
      'A whipped tropical body butter that melts into dry skin for long-lasting comfort.',
    benefits: 'Mango butter • Shea butter • Coconut oil',
    image: '/products/08-mango-melt-body-butter.webp',
    stock: 22,
    featured: 0,
  },
  {
    name: 'Vitamin C Day Cream',
    slug: 'vitamin-c-day-cream',
    category: 'Face Cream',
    price: 18200,
    description:
      'A brightening daytime moisturizer made for a fresh, rested-looking complexion.',
    benefits: 'Vitamin C derivative • Vitamin E • Squalane',
    image: '/products/09-vitamin-c-day-cream.webp',
    stock: 19,
    featured: 1,
  },
  {
    name: 'Coconut Milk Body Cream',
    slug: 'coconut-milk-body-cream',
    category: 'Body Cream',
    price: 13500,
    description:
      'A creamy everyday hydrator with a soft coconut scent and silky after-feel.',
    benefits: 'Coconut milk • Glycerin • Shea butter',
    image: '/products/10-coconut-milk-body-cream.webp',
    stock: 26,
    featured: 0,
  },
  {
    name: 'Ceramide Barrier Cream',
    slug: 'ceramide-barrier-cream',
    category: 'Face Cream',
    price: 18800,
    description:
      'A comforting moisturizer designed for dry, easily stressed skin and barrier support.',
    benefits: 'Ceramides • Panthenol • Oat extract',
    image: '/products/11-ceramide-barrier-cream.webp',
    stock: 16,
    featured: 1,
  },
  {
    name: 'Lavender Sleep Body Butter',
    slug: 'lavender-sleep-body-butter',
    category: 'Body Butter',
    price: 16500,
    description:
      'A rich nighttime body butter with a soft lavender scent for an indulgent evening routine.',
    benefits: 'Shea butter • Lavender • Jojoba oil',
    image: '/products/12-lavender-sleep-body-butter.webp',
    stock: 14,
    featured: 0,
  },
  {
    name: 'Bright Hands Hand Cream',
    slug: 'bright-hands-hand-cream',
    category: 'Hand Cream',
    price: 9200,
    description:
      'A fast-absorbing hand cream that moisturizes without leaving palms greasy.',
    benefits: 'Niacinamide • Glycerin • Vitamin E',
    image: '/products/13-bright-hands-hand-cream.webp',
    stock: 35,
    featured: 0,
  },
  {
    name: 'Aloe Calm Face Cream',
    slug: 'aloe-calm-face-cream',
    category: 'Face Cream',
    price: 13800,
    description:
      'A lightweight soothing cream for hot days or skin that needs simple hydration.',
    benefits: 'Aloe vera • Panthenol • Centella',
    image: '/products/14-aloe-calm-face-cream.webp',
    stock: 25,
    featured: 0,
  },
  {
    name: 'Shea Satin Body Cream',
    slug: 'shea-satin-body-cream',
    category: 'Body Cream',
    price: 14900,
    description:
      'A silky body cream for everyday moisture with a soft satin finish.',
    benefits: 'Shea butter • Glycerin • Vitamin E',
    image: '/products/15-shea-satin-body-cream.webp',
    stock: 21,
    featured: 0,
  },
  {
    name: 'Golden Hour Glow Cream',
    slug: 'golden-hour-glow-cream',
    category: 'Body Cream',
    price: 17900,
    description:
      'A glow-enhancing body moisturizer that leaves skin looking smooth and radiant.',
    benefits: 'Niacinamide • Mica • Sweet almond oil',
    image: '/products/16-golden-hour-glow-cream.webp',
    stock: 18,
    featured: 1,
  },
  {
    name: 'Honey Oat Comfort Cream',
    slug: 'honey-oat-comfort-cream',
    category: 'Face Cream',
    price: 15400,
    description:
      'A gentle comfort cream for dry skin with a soft, nourishing texture.',
    benefits: 'Colloidal oat • Honey extract • Ceramides',
    image: '/products/17-honey-oat-comfort-cream.webp',
    stock: 20,
    featured: 0,
  },
  {
    name: 'Berry Smooth Body Butter',
    slug: 'berry-smooth-body-butter',
    category: 'Body Butter',
    price: 16200,
    description:
      'A whipped body butter with a subtle berry scent and plush skin feel.',
    benefits: 'Shea butter • Berry extract • Jojoba oil',
    image: '/products/18-berry-smooth-body-butter.webp',
    stock: 17,
    featured: 0,
  },
  {
    name: 'Silk Veil Hand Cream',
    slug: 'silk-veil-hand-cream',
    category: 'Hand Cream',
    price: 8800,
    description:
      'A handbag-friendly hand cream that softens cuticles and dry hands throughout the day.',
    benefits: 'Glycerin • Squalane • Panthenol',
    image: '/products/19-silk-veil-hand-cream.webp',
    stock: 32,
    featured: 0,
  },
  {
    name: 'Midnight Renewal Cream',
    slug: 'midnight-renewal-cream',
    category: 'Face Cream',
    price: 20500,
    description:
      'A richer overnight moisturizer for a smoother, rested-looking complexion by morning.',
    benefits: 'Bakuchiol • Peptides • Ceramides',
    image: '/products/20-midnight-renewal-cream.webp',
    stock: 13,
    featured: 1,
  },
]

/**
 * Remembers the in-progress or completed setup.
 *
 * WHY THIS IS CACHED
 * `initDatabase()` is called before every single API request. Without caching,
 * every request would re-run the CREATE TABLE statements and re-count the
 * products, which would be slow and pointless.
 *
 * Storing the promise (rather than a simple true/false flag) is deliberate: if
 * several requests arrive at the same moment on a cold start, they all await
 * the SAME setup instead of racing to create the tables at once.
 */
let initializationPromise

/**
 * Make sure the database is ready to use.
 *
 * Safe to call as often as you like. The real work happens once; every later
 * call returns the finished promise straight away.
 *
 * @returns {Promise<void>}
 */
export function initDatabase() {
  if (!initializationPromise) {
    initializationPromise = initialize()
  }

  return initializationPromise
}

/**
 * The actual one-time setup: create the tables, then seed them if empty.
 *
 * `batch` sends several SQL statements together in one round trip, which is
 * considerably faster than sending them one at a time over the network to
 * Turso in production.
 */
async function initialize() {
  await db.batch(
    [
      /*
       * PRODUCTS
       * `id INTEGER PRIMARY KEY AUTOINCREMENT` is the database's own counter,
       * so every product gets a unique number automatically.
       * `slug` is UNIQUE because it appears in web addresses, and two products
       * cannot share an address.
       */
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT NOT NULL,
        benefits TEXT NOT NULL,
        image TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        featured INTEGER NOT NULL DEFAULT 0
      )`,

      /*
       * ORDERS
       * `created_at` fills itself in with the current time, so no code has to
       * remember to set it.
       * `notes` defaults to an empty string rather than allowing NULL, which
       * saves every reader from checking for both "no notes" and "empty notes".
       */
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        total INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      /*
       * ORDER ITEMS
       * The two FOREIGN KEY lines link each row to its order and its product.
       * `ON DELETE CASCADE` on the order means that if an order were ever
       * deleted, its line items would be removed with it rather than left
       * orphaned.
       *
       * There is deliberately no cascade on the product link. Products that
       * appear in an order are protected from deletion in application code, so
       * that order history cannot silently lose its contents.
       */
      `CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
      )`,
    ],
    'write'
  )

  // Count the products. If there are none, this is a brand new database and the
  // starter catalogue should be inserted.
  const countResult = await db.execute('SELECT COUNT(*) AS count FROM products')
  const productCount = Number(countResult.rows[0]?.count || 0)

  if (productCount === 0) {
    await db.batch(
      seedProducts.map((product) => ({
        sql: `INSERT INTO products
                (name, slug, category, price, description, benefits, image, stock, featured)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        // The order of these values must match the columns listed above.
        args: [
          product.name,
          product.slug,
          product.category,
          product.price,
          product.description,
          product.benefits,
          product.image,
          product.stock,
          product.featured,
        ],
      })),
      'write'
    )
  }
}

export default db
