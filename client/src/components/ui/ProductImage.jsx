/**
 * PRODUCT IMAGE
 * =============
 *
 * WHAT THIS COMPONENT IS
 * A product picture that quietly repairs itself when the image file is missing.
 *
 * WHY THIS EXISTS
 * The catalogue is seeded with twenty products whose images are named
 * /products/01-....webp through /products/20-....webp. Those final artwork
 * files have not been produced yet, so most of them do not exist. A plain
 * <img> would show a broken-image icon all over the shop.
 *
 * Instead, if the browser fails to load the picture, we swap in the placeholder
 * and the layout still looks deliberate.
 *
 * This is a real, concrete failure that actually happens, which is why the
 * guard is justified rather than defensive clutter.
 */

import { PLACEHOLDER_IMAGE } from '../../lib/constants.js'

/**
 * @param {object} props
 * @param {string} props.src the image URL to try first
 * @param {string} props.alt a description of the image, for screen readers
 * @param {string} [props.className] optional extra CSS classes
 * @param {boolean} [props.lazy] true to defer loading until scrolled into view
 */
export default function ProductImage({ src, alt, className, lazy = false }) {
  /**
   * Runs when the browser cannot load the image.
   *
   * The check on the last line matters: if the placeholder itself were somehow
   * missing we would otherwise set the source to the same failing value and
   * loop forever.
   */
  function handleError(event) {
    if (event.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) {
      return
    }

    event.currentTarget.src = PLACEHOLDER_IMAGE
  }

  return (
    <img
      src={src || PLACEHOLDER_IMAGE}
      alt={alt}
      className={className}
      loading={lazy ? 'lazy' : undefined}
      onError={handleError}
    />
  )
}
