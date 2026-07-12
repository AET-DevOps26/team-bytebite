import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createApiClient } from '../lib/api'
import type { AuthPayload, AuthUser } from '../types'
import { AuthContext, type AuthContextValue, type SessionStatus } from './authContext'

const TOKEN_KEY = 'bytebite-token'
const USER_KEY = 'bytebite-user'

function readStoredSession(): AuthPayload | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const user = localStorage.getItem(USER_KEY)
  if (!token || !user) return null
  try {
    return { token, user: JSON.parse(user) as AuthUser }
  } catch {
    return null
  }
}

// Owns the session. State and localStorage are only ever written together, in signIn/signOut, so
// the two cannot drift apart — which they could when each caller persisted them by hand.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthPayload | null>(readStoredSession)
  const [status, setStatus] = useState<SessionStatus>(() => (readStoredSession() ? 'restoring' : 'anonymous'))

  const token = session?.token ?? ''

  const signIn = useCallback((payload: AuthPayload) => {
    setSession(payload)
    setStatus('authenticated')
    localStorage.setItem(TOKEN_KEY, payload.token)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  }, [])

  const signOut = useCallback(() => {
    setSession(null)
    setStatus('anonymous')
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  // Keyed on the token string rather than the session object, so the client — and with it every
  // callback in the data hooks — keeps its identity across ordinary re-renders. It is rebuilt only
  // when the token actually changes: signing in or out, or the server re-issuing the JWT after a
  // profile edit (which also re-reads the collections under the new token).
  const api = useMemo(
    () => createApiClient({ getToken: () => token, onUnauthorized: signOut }),
    [token, signOut]
  )

  // Revalidates a stored token on boot. The server returns a fresh token plus the current user, so
  // a success is just another sign-in; a failure drops the session and the route guard sends the
  // user to the login page. Guarded on 'restoring' so it runs exactly once, at startup.
  useEffect(() => {
    if (status !== 'restoring') return
    api.get<AuthPayload>('/users/me').then(signIn).catch(signOut)
  }, [status, api, signIn, signOut])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token,
      status,
      signIn,
      signOut,
      api,
    }),
    [session, token, status, signIn, signOut, api]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
