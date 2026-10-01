/**
 * OPEN GRAPH SHARE IMAGE
 * ======================
 *
 * WHAT THIS FILE IS
 * The picture that appears when a Veloura link is shared on social media
 * (WhatsApp, Facebook, X, LinkedIn). It is a JPEG stored directly in this file
 * as base64 text, which is why this file looks the way it does.
 *
 * WHY THE IMAGE IS STORED AS TEXT
 * Base64 turns binary data into plain characters so it can live inside a
 * JavaScript file. The alternative is a separate binary file that has to be
 * read from disk and bundled correctly on every deployment. Keeping it inline
 * means the image can never go missing at runtime.
 *
 * The trade-off is that a picture is unreadable when written out this way,
 * which is why it is split into short lines below. Splitting it changes
 * nothing: JavaScript joins the pieces back into one string before decoding,
 * so the resulting bytes are exactly the same.
 *
 * HOW THE PIECES FIT TOGETHER
 *   OG_IMAGE_BASE64  the image as base64 text, in 76-character lines
 *   ogImageBuffer    the same data decoded into the raw bytes to send
 *
 * `app.js` serves `ogImageBuffer` from `/api/og-image.jpg`.
 *
 * ---------------------------------------------------------------------------
 * KNOWN PROBLEM — PLEASE READ BEFORE CHANGING ANYTHING HERE
 * ---------------------------------------------------------------------------
 * This base64 text is 6,429 characters long. A valid base64 string must have a
 * length that is a multiple of 4, and 6,429 is not, so the text is truncated
 * and the image it produces is incomplete.
 *
 * You can see the damage in the decoded bytes: they begin with the correct JPEG
 * header (FF D8 FF) but end with CF FF instead of the JPEG end marker (FF D9).
 * Browsers may still render what they can, but social media crawlers usually
 * require a complete image and will show no preview at all.
 *
 * This file has NOT been changed to fix that, because fixing it means replacing
 * the image, which is a decision for the shop owner rather than a formatting
 * change. It is recorded in docs/session-handoff-next.md as follow-up work.
 *
 * Separately, there is a second, unused share-image generator at
 * `api/og-image.js`, which draws a PNG from scratch. Which of the two
 * production actually serves has not been confirmed.
 * ---------------------------------------------------------------------------
 */

/**
 * The share image as base64 text.
 *
 * The `+` at the end of each line joins the pieces into a single string. It is
 * only here so the image can be written across many short lines instead of one
 * 6,429-character line.
 */
const OG_IMAGE_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDADknKzIrJDkyLjJAPTlEVo9dVk9PVq99hGiPz7ba1su2' +
  'yMTk////5PP/9sTI////////////3f//////////////2wBDAT1AQFZLVqhdXaj/7Mjs////////' +
  '////////////////////////////////////////////////////////////wgARCADSAZADASIA' +
  'AhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAAAAECAwT/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAQL/' +
  '2gAMAwEAAhADEAAAAeiJbAAAAACXj04dbNXnY66zupnpDnnfOJnPOu7iOrjTvvl2lumrMzeThy68' +
  'o69uXUCiiZ1glu1zZAEAAAELAqyXzdeXWyWWOu8bqywxjeJePPpzuaCWU69uPaa3rOrGdZOHLryj' +
  'v059SLKGRGlumUkF2EgCAoy2OboMzeY8vVazSOu+Wzcis8+nOXlz687ktXFpOnbj1mumuds3nMOf' +
  'PrI1057KlqZFus6NY1EytWZgqCxDW5pEQrI6oQCKXDcMTpDDY5tjDYw2MNjNtMtDKiWUTWSBbvNR' +
  'OfOO+8brktXO9xM0KkLKItNSxAUAgskNTOhMjTNKwNmDdgoICXOxLDNhbwSSmk7WLrVmUsmV1ICI' +
  '1cq1cU7BmBQGNiZ0MaDE2MasMzYZ1QCywhFdOfRMzUjEchdVM6pds23WIiyC6x3qTZODryVVOwZg' +
  'AAVKMqICLAABZQgixZz6cZN647hncrslpjVOLsjlKV259LFsCUY6C8uuDYSABctQk1CKM2UzVJKJ' +
  'nYzsEsLAnDvxibnoTltFtilkipTSbqWCwglKKSw0EgAAJncXLQzNDF0MTYAASiEVz6YkuLo0uTUW' +
  'mYjVg6kpKIqJZmXdxuzMxI9A1IABKWTQkozNQKJNQy0BBYEsVjXOSzA6Zz0N3h6CN6rlrVEyNpRA' +
  'Y6yJNcTF59TvYsAASiBSAgqQ1IKgssJUVKJnWZJLSb1sztbEsIF5Fl6WrkZLJyluGTPTI9OsK2zS' +
  'hABFSiQCwAELAhCwC5l10z0sk0QgoJNQ8++dze9xvSTQxOkjE6Qw2M3UrKwtzDd502xDbENzI1cQ' +
  '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'

/**
 * The decoded image bytes, ready to send to a browser.
 *
 * `Buffer.from(text, 'base64')` performs the decoding.
 */
export const ogImageBuffer = Buffer.from(OG_IMAGE_BASE64, 'base64')
