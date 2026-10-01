/**
 * ADMIN LOGIN SCREEN
 * ==================
 *
 * WHAT THIS COMPONENT IS
 * The split-screen sign-in page: the form on the left, decorative brand art on
 * the right. This is what the owner sees before they are signed in.
 *
 * HOW THE FORM IS READ
 * The two inputs are read once at submit time using `new FormData`, rather than
 * being tracked keystroke by keystroke. For a two-field login form there is
 * nothing to react to while typing, so keeping them uncontrolled is simpler.
 *
 * WHY THE ERROR IS CAUGHT HERE
 * `signIn` in the `useAdminAuth` hook deliberately lets the error through, so
 * that this component can show the message directly beneath the fields, which
 * is where the owner is already looking.
 */

import { useState } from 'react'

/**
 * @param {object} props
 * @param {(email: string, password: string) => Promise<void>} props.onSignIn
 */
export default function AdminLogin({ onSignIn }) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  /** Send the typed credentials and report any failure. */
  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSubmitting(true)

    const formValues = Object.fromEntries(new FormData(event.currentTarget))

    try {
      await onSignIn(formValues.email, formValues.password)
    } catch (signInError) {
      setError(signInError.message)
    } finally {
      // Runs whether the attempt succeeded or failed, so the button never gets
      // stuck reading "Signing in…".
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-panel">
        <a className="admin-brand" href="/">
          VELOURA <small>ADMIN</small>
        </a>

        <div>
          <p className="admin-eyebrow">Store management</p>
          <h1>Welcome back.</h1>
          <p className="admin-muted">
            Sign in to manage products, stock and customer orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Email
            <input required type="email" name="email" autoComplete="username" />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              name="password"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="admin-error">{error}</p> : null}

          <button className="admin-primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <a href="/" className="admin-back">
          ← Back to storefront
        </a>
      </div>

      <div className="admin-login-art">
        <span>VELOURA</span>
        <strong>
          Pure care.
          <br />
          Real results.
        </strong>
        <p>Manage every product and order in one calm workspace.</p>
      </div>
    </div>
  )
}
