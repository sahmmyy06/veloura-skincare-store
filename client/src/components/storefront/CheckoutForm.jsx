/**
 * CHECKOUT FORM
 * =============
 *
 * WHAT THIS COMPONENT IS
 * The delivery details form shown inside the cart drawer after the customer
 * presses "Continue to checkout".
 *
 * WHY IT USES UNCONTROLLED INPUTS
 * The form fields are read once, at submit time, using `new FormData`. React
 * does not track each keystroke. For a short form that is only read when the
 * customer presses the button, this is simpler than keeping seven pieces of
 * state in sync, and it is easier to explain: the browser already knows what
 * the customer typed, so we just ask it at the end.
 *
 * The `required` attributes are what produce the browser's own validation
 * messages before the request is ever sent.
 */

import { formatMoney } from '../../lib/format.js'

/**
 * @param {object} props
 * @param {number} props.total the order total, shown on the submit button
 * @param {string} props.error a message to show when submission failed
 * @param {boolean} props.submitting true while the order is being sent
 * @param {() => void} props.onBack go back to the bag without ordering
 * @param {(customerDetails: object) => void} props.onSubmit
 */
export default function CheckoutForm({ total, error, submitting, onBack, onSubmit }) {
  /**
   * Collect the form values and hand them to the parent.
   *
   * `Object.fromEntries(new FormData(...))` turns the form into a plain object
   * keyed by each input's `name` attribute, which is exactly the shape the API
   * expects.
   */
  function handleSubmit(event) {
    event.preventDefault()

    const formValues = Object.fromEntries(new FormData(event.currentTarget))
    onSubmit(formValues)
  }

  return (
    <form className="checkout" onSubmit={handleSubmit}>
      <button type="button" className="back-link" onClick={onBack}>
        ← Back to bag
      </button>

      <h3>Delivery details</h3>

      <label>
        Full name
        <input required name="customerName" />
      </label>

      <label>
        Email
        <input required type="email" name="email" />
      </label>

      <label>
        Phone
        <input required name="phone" placeholder="080…" />
      </label>

      <label>
        Delivery address
        <textarea required name="address" rows="3" />
      </label>

      <label>
        City / State
        <input required name="city" />
      </label>

      <label>
        Order notes <small>(optional)</small>
        <textarea name="notes" rows="2" />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="primary wide" type="submit" disabled={submitting}>
        Place order · {formatMoney(total)}
      </button>
    </form>
  )
}
