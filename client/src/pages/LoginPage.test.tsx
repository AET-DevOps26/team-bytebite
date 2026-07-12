import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { AuthProvider } from '../contexts/AuthProvider'
import type { AuthPayload } from '../types'

const payload: AuthPayload = {
  token: 'jwt-123',
  user: { userId: 'u1', name: 'Ada', email: 'ada@example.com', createdAt: '2026-01-01' },
}

function mockFetchOnce(response: { status: number; body: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: () => Promise.resolve(response.body),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// The page signs in through the auth context and then redirects, so it renders inside the provider
// and a router, with a stand-in for the page it lands on.
function renderLoginPage() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<h1>Signed in</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

// Both the mode toggle and the form's submit button read "Login", so disambiguate the submit
// action by its type attribute.
function submitButton() {
  const button = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit')
  if (!button) throw new Error('submit button not found')
  return button
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LoginPage', () => {
  it('logs in, stores the session, and redirects into the app', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetchOnce({ status: 200, body: payload })
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'supersecret')
    await user.click(submitButton())

    expect(await screen.findByText('Signed in')).toBeInTheDocument()
    expect(localStorage.getItem('bytebite-token')).toBe('jwt-123')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect(JSON.parse(init.body)).toEqual({ email: 'ada@example.com', password: 'supersecret' })
  })

  it('sends the name field and the register endpoint in register mode', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetchOnce({ status: 200, body: payload })
    renderLoginPage()

    await user.click(screen.getByRole('button', { name: /register/i }))
    await user.type(screen.getByLabelText('Name'), 'Ada')
    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'supersecret')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/register')
    expect(JSON.parse(init.body)).toEqual({ name: 'Ada', email: 'ada@example.com', password: 'supersecret' })
  })

  it("surfaces the server's error message and stays on the login page", async () => {
    const user = userEvent.setup()
    // Rejected credentials answer 401 too. With no session to tear down, that must simply surface
    // the message rather than trip the api client's sign-out-on-401.
    mockFetchOnce({ status: 401, body: { message: 'Invalid credentials' } })
    renderLoginPage()

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpass1')
    await user.click(submitButton())

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    expect(screen.queryByText('Signed in')).not.toBeInTheDocument()
    expect(localStorage.getItem('bytebite-token')).toBeNull()
  })
})
