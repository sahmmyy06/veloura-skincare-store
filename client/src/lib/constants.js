/**
 * STOREFRONT CONSTANTS
 * ====================
 *
 * WHAT THIS FILE IS
 * Fixed values shared by more than one storefront component.
 *
 * WHY THEY ARE NOT JUST TYPED INTO EACH COMPONENT
 * The category list appears in the filter pills and in the admin product form.
 * If it were copied into both places, adding a new category would mean finding
 * and updating every copy, and forgetting one would leave the shop
 * inconsistent. Defining it once means there is one list to change.
 */

/**
 * The product categories customers can filter by.
 *
 * "All" comes first because it is the default and always the widest choice.
 * The remaining four must match the category values stored in the database
 * exactly, or the filter will find nothing.
 */
export const PRODUCT_CATEGORIES = [
  'All',
  'Face Cream',
  'Body Cream',
  'Body Butter',
  'Hand Cream',
]

/**
 * Shown when a product image file is missing.
 *
 * The seed products point at files like /products/01-....webp, most of which
 * have not been produced yet. Every image element falls back to this file so
 * the layout never shows a broken image icon.
 */
export const PLACEHOLDER_IMAGE = '/products/placeholder.svg'

/**
 * The small trust badges shown in the strip under the hero.
 *
 * Kept as data rather than written out three times in the markup, so the list
 * can be reordered or extended by editing one array. The `icon` value is a
 * component, which is why this file is written in the way it is: the Hero
 * component imports both the data and the icons it needs.
 */
export const STOREFRONT_BENEFITS = [
  { title: 'Fast delivery', detail: 'Across Nigeria' },
  { title: 'Everyday care', detail: 'Simple routines' },
  { title: 'Secure checkout', detail: 'Your details stay protected' },
]
