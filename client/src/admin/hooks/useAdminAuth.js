/**
 * useAdminAuth — WHO IS SIGNED IN
 * ===============================
 *
 * WHAT THIS HOOK IS
 * It answers one question when the admin page loads: "is this visitor signed
 * in?" Until it has an answer, the app shows a loading splash.
 *
 * WHY THERE IS A CHECKING STATE
 * The session lives in an HttpOnly cookie, which JavaScript is not allowed to
 * read. So the app genuinely cannot know whether the visitor is signed in until
 * the server answers. Without a `checking` state the app would briefly flash
 * the login screen to an already-signed-in owner on every page load, which
 * looks like a bug.
 *
 * The three states this produces:
 *   checking = true   -> show the splash
 *   user is set       -> show the dashboard
 *   user is null      -> show the login screen
 */

import { useEffect, useState } from 'react'
import { adminLogin, adminLogout, adminMe } from '../lib/api.js'

/**
 * @returns {{
 *   checking: boolean,
 *   user: { email: string } | null,
 *   signIn: (email: string, password: string) => Promise<void>,
 *   signOut: () => Promise<void>,
 * }}
 */
export function useAdminAuth() {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(null)

  /**
   * Ask the server who we are.
   *
   * A failure here is the normal "not signed in" case, not an error worth
   * showing, so the catch simply clears the user.
   */
  async function checkAuth() {
    setChecking(true)

    try {
      const me = await adminMe()
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  /**
   * Sign in with the details from the login form.
   *
   * Errors are deliberately NOT caught here. The login form catches them so it
   * can display the message next to the fields, which is where the user is
   * looking. Swallowing the error here would leave the form silent.
   */
  async function signIn(email, password) {
    await adminLogin(email, password)
    await checkAuth()
  }

  /**
   * Sign out.
   *
   * Even if the server call fails we still clear the local user, because
   * leaving the owner apparently signed in after they pressed Sign out would be
   * worse than a failed request.
   */
  async function signOut() {
    await adminLogout().catch(() => {})
    setUser(null)
  }

  return { checking, user, signIn, signOut }
}
