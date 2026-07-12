import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProfilePage } from './ProfilePage'
import { AuthProvider } from '../contexts/AuthProvider'
import type { AuthPayload } from '../types'

const auth: AuthPayload = {
  token: 'jwt-1',
  user: { userId: 'u1', name: 'Ada', email: 'ada@example.com', createdAt: '2026-01-01' },
}

type Reply = { status: number; body?: unknown }

// Routes by "METHOD /path"; anything unrouted fails loudly rather than silently resolving.
function installApi(routes: Record<string, Reply>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${(init?.method ?? 'GET').toUpperCase()} ${String(input)}`
    const reply = routes[key]
    if (!reply) throw new Error(`No mock registered for ${key}`)
    return {
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      json: async () => reply.body,
    } as unknown as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderProfile() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('bytebite-token', auth.token)
  localStorage.setItem('bytebite-user', JSON.stringify(auth.user))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ProfilePage', () => {
  it('saves name and email, and adopts the re-issued token', async () => {
    const user = userEvent.setup()
    const updated: AuthPayload = {
      token: 'jwt-2',
      user: { ...auth.user, name: 'Ada Lovelace' },
    }
    const fetchMock = installApi({
      'GET /api/users/me': { status: 200, body: auth },
      'PATCH /api/users/me': { status: 200, body: updated },
    })
    renderProfile()

    const nameField = screen.getByDisplayValue('Ada')
    await user.clear(nameField)
    await user.type(nameField, 'Ada Lovelace')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText('Profile updated.')).toBeInTheDocument()

    // The JWT embeds the name, so the server re-issues it and the new one replaces the session.
    await waitFor(() => expect(localStorage.getItem('bytebite-token')).toBe('jwt-2'))
    const patch = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PATCH')!
    expect(JSON.parse((patch[1] as RequestInit).body as string))
      .toEqual({ name: 'Ada Lovelace', email: 'ada@example.com' })
  })

  it('reports a wrong current password without ending the session', async () => {
    const user = userEvent.setup()
    // The backend answers a wrong current password with 401 — the same status an expired token
    // produces. Mistyping it must show the message, not sign the user out.
    installApi({
      'GET /api/users/me': { status: 200, body: auth },
      'PUT /api/users/me/password': { status: 401, body: { message: 'Current password is incorrect.' } },
    })
    renderProfile()

    await user.type(screen.getByLabelText('Current password'), 'wrongpass1')
    await user.type(screen.getByLabelText('New password'), 'newpassword1')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument()
    expect(localStorage.getItem('bytebite-token')).toBe('jwt-1')
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
  })

  it('signs the user out after a successful password change', async () => {
    const user = userEvent.setup()
    installApi({
      'GET /api/users/me': { status: 200, body: auth },
      'PUT /api/users/me/password': { status: 204 },
    })
    renderProfile()

    await user.type(screen.getByLabelText('Current password'), 'supersecret')
    await user.type(screen.getByLabelText('New password'), 'newpassword1')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    expect(await screen.findByText(/please sign in again/i)).toBeInTheDocument()
    // The sign-out is deferred so the confirmation is readable first.
    await waitFor(
      () => expect(localStorage.getItem('bytebite-token')).toBeNull(),
      { timeout: 3000 }
    )
  })
})
