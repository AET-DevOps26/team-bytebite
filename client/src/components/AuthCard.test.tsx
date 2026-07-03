import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthCard, type AuthPayload } from './AuthCard'

const payload: AuthPayload = {
  token: 'jwt-123',
  user: { userId: 'u1', name: 'Ada', email: 'ada@example.com', createdAt: '2026-01-01' },
}

function mockFetchOnce(response: { ok: boolean; body: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    json: () => Promise.resolve(response.body),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Both the mode toggle and the form's submit button read "Login", so disambiguate the submit
// action by its type attribute.
function submitButton() {
  const button = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit')
  if (!button) throw new Error('submit button not found')
  return button
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AuthCard', () => {
  it('logs in and hands the payload back to the parent', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetchOnce({ ok: true, body: payload })
    const onAuthenticated = vi.fn()
    render(<AuthCard onAuthenticated={onAuthenticated} />)

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'supersecret')
    await user.click(submitButton())

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(payload))

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect(JSON.parse(init.body)).toEqual({ email: 'ada@example.com', password: 'supersecret' })
  })

  it('sends the name field and the register endpoint in register mode', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetchOnce({ ok: true, body: payload })
    render(<AuthCard onAuthenticated={vi.fn()} />)

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

  it("surfaces the server's error message and does not authenticate", async () => {
    const user = userEvent.setup()
    mockFetchOnce({ ok: false, body: { message: 'Invalid credentials' } })
    const onAuthenticated = vi.fn()
    render(<AuthCard onAuthenticated={onAuthenticated} />)

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpass1')
    await user.click(submitButton())

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
    expect(onAuthenticated).not.toHaveBeenCalled()
  })
})