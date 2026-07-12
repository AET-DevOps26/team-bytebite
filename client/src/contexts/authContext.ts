// The session context itself, kept apart from the provider component so that this file exports
// only hooks (react-refresh requires a component file to export nothing but components).
import { createContext, useContext } from 'react'
import type { ApiClient } from '../lib/api'
import type { AuthPayload, AuthUser } from '../types'

// 'restoring' means a token was found in storage and is being revalidated against the server. The
// app renders optimistically during that window, so it never flashes the login screen on refresh.
export type SessionStatus = 'restoring' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: AuthUser | null
  token: string
  status: SessionStatus
  signIn: (payload: AuthPayload) => void
  signOut: () => void
  api: ApiClient
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

// Sugar for the common case: a component that needs to call the API but not read the session.
export function useApi(): ApiClient {
  return useAuth().api
}
