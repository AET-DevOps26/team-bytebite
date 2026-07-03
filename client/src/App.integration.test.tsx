import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import type { AuthPayload } from './components/AuthCard'
import type {
  ApiRecipe, ApiRecipeSummary, ApiGroceryList, ApiGroceryListSummary,
} from './types'

// These tests render the real App and mock `fetch` at the network boundary, so they exercise the
// wiring in App.tsx — token threading, the API↔view-model mappers, and state created in one view
// that surfaces in another — which the isolated component tests can't reach.

// ── A tiny declarative fake backend ─────────────────────────────────────────────────────────
type ResponseSpec = { status?: number; body?: unknown }
type Route = {
  method: string
  match: string | RegExp
  respond: ResponseSpec | ((call: { count: number }) => ResponseSpec)
}

function installApi(routes: Route[]) {
  const counts = new Map<Route, number>()
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method ?? 'GET').toUpperCase()
    const route = routes.find(
      r => r.method === method && (typeof r.match === 'string' ? r.match === url : r.match.test(url))
    )
    if (!route) throw new Error(`No mock registered for ${method} ${url}`)
    const count = (counts.get(route) ?? 0) + 1
    counts.set(route, count)
    const spec = typeof route.respond === 'function' ? route.respond({ count }) : route.respond
    const status = spec.status ?? 200
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => spec.body,
    } as unknown as Response
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// ── Fixtures ────────────────────────────────────────────────────────────────────────────────
const auth: AuthPayload = {
  token: 'jwt-1',
  user: { userId: 'u1', name: 'Ada', email: 'ada@example.com', createdAt: '2026-01-01' },
}

const recipeSummaries: ApiRecipeSummary[] = [
  { recipeId: 'r1', name: 'Pasta', createdAt: '2026-01-02' },
  { recipeId: 'r2', name: 'Salad', createdAt: '2026-01-03' },
]

const mergedList: ApiGroceryList = {
  groceryListId: 'g9',
  name: 'Pasta + Salad',
  createdAt: '2026-01-04',
  items: [
    { itemId: 'i1', name: 'Tomato', quantity: 3, unit: '', category: 'PRODUCE', purchased: false },
    { itemId: 'i2', name: 'Pasta', quantity: 500, unit: 'g', category: 'PANTRY', purchased: false },
  ],
}

/** Seeds a logged-in session so App boots straight into the main UI. */
function seedSession() {
  localStorage.setItem('bytebite-token', auth.token)
  localStorage.setItem('bytebite-user', JSON.stringify(auth.user))
}

const okRecipes = { method: 'GET', match: '/api/recipes', respond: { body: recipeSummaries } } as Route
const okGroceryEmpty = { method: 'GET', match: '/api/grocery-list', respond: { body: [] as ApiGroceryListSummary[] } } as Route
const okSession = { method: 'GET', match: '/api/users/me', respond: { body: auth } } as Route

function gotoView(user: ReturnType<typeof userEvent.setup>, name: 'Recipes' | 'Grocery Lists') {
  return user.click(screen.getByRole('button', { name }))
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('auth bootstrap', () => {
  it('logs in, then loads and shows the session', async () => {
    const user = userEvent.setup()
    const fetchMock = installApi([
      { method: 'POST', match: '/api/auth/login', respond: { body: auth } },
      okRecipes,
      okGroceryEmpty,
    ])
    render(<App />)

    // Starts on the auth screen.
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'supersecret')
    const submit = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit')!
    await user.click(submit)

    // Lands in the app: the sidebar shows the authenticated user…
    expect(await screen.findByText('Ada')).toBeInTheDocument()
    // …and the bootstrap fired the two list loads with the returned token.
    await waitFor(() => {
      const calls = fetchMock.mock.calls.map(([u]) => String(u))
      expect(calls).toContain('/api/recipes')
      expect(calls).toContain('/api/grocery-list')
    })
  })

  it('drops back to the auth screen when the stored session is rejected', async () => {
    seedSession()
    installApi([{ method: 'GET', match: '/api/users/me', respond: { status: 401 } }])
    render(<App />)

    expect(await screen.findByText('Sign in to continue')).toBeInTheDocument()
    expect(localStorage.getItem('bytebite-token')).toBeNull()
  })
})

describe('recipe workflows', () => {
  it('merges recipes on the Recipes page and the new list appears under Grocery Lists', async () => {
    const user = userEvent.setup()
    seedSession()
    installApi([
      okSession,
      okRecipes,
      okGroceryEmpty,
      { method: 'POST', match: '/api/grocery-list/merge', respond: { body: mergedList } },
    ])
    render(<App />)

    await gotoView(user, 'Recipes')
    await screen.findByText('Pasta')
    await screen.findByText('Salad')

    // Select both recipes, then merge.
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(checkboxes[1])
    await user.click(screen.getByRole('button', { name: 'Merge' }))

    expect(await screen.findByText(/merged!/i)).toBeInTheDocument()

    // The merged list lives in App state, so it shows up when we switch views.
    await gotoView(user, 'Grocery Lists')
    expect(await screen.findByText('Pasta + Salad')).toBeInTheDocument()
  })

  it('creates a recipe from the manual editor and prepends it to the list', async () => {
    const user = userEvent.setup()
    seedSession()
    const created: ApiRecipe = {
      recipeId: 'r9', name: 'Tacos', createdAt: '2026-01-05',
      items: [{ itemId: 'i1', name: 'Tortilla', quantity: 8, unit: '', category: 'BAKERY' }],
    }
    installApi([
      okSession,
      { method: 'GET', match: '/api/recipes', respond: { body: [] as ApiRecipeSummary[] } },
      okGroceryEmpty,
      { method: 'POST', match: '/api/recipes', respond: { body: created } },
    ])
    render(<App />)

    await gotoView(user, 'Recipes')
    await screen.findByText('No recipes yet')

    await user.click(screen.getByRole('button', { name: /new recipe/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByPlaceholderText('e.g. Spaghetti Bolognese'), 'Tacos')
    await user.type(within(dialog).getByPlaceholderText('Item name'), 'Tortilla')
    await user.click(within(dialog).getByRole('button', { name: 'Create recipe' }))

    expect(await screen.findByText('Tacos')).toBeInTheDocument()
  })

  it('rolls back an optimistic delete when the server rejects it', async () => {
    const user = userEvent.setup()
    seedSession()
    installApi([
      okSession,
      { method: 'GET', match: '/api/recipes', respond: { body: [recipeSummaries[0]] } },
      okGroceryEmpty,
      { method: 'DELETE', match: /\/api\/recipes\/r1$/, respond: { status: 500 } },
    ])
    render(<App />)

    await gotoView(user, 'Recipes')
    await screen.findByText('Pasta')

    await user.click(screen.getByRole('button', { name: 'Delete recipe' }))

    // Optimistically removed, then restored once the DELETE fails.
    await waitFor(() => expect(screen.getByText('Pasta')).toBeInTheDocument())
  })

  it('recovers from a failed recipe load via Try again', async () => {
    const user = userEvent.setup()
    seedSession()
    installApi([
      okSession,
      // First load fails; the retry succeeds.
      { method: 'GET', match: '/api/recipes', respond: ({ count }) => (count === 1 ? { status: 500 } : { body: [recipeSummaries[0]] }) },
      okGroceryEmpty,
    ])
    render(<App />)

    await gotoView(user, 'Recipes')
    expect(await screen.findByText(/couldn't load recipes/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Pasta')).toBeInTheDocument()
  })
})