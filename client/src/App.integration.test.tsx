import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import type {
  AuthPayload, ApiRecipe, ApiRecipeSummary, ApiGroceryList, ApiGroceryListSummary,
} from './types'

// These tests render the real App and mock `fetch` at the network boundary, so they exercise the
// wiring App owns — the session and api layer, the API↔view-model mappers, routing, and state
// created on one page that surfaces on another — which the isolated component tests can't reach.
// The router lives outside App (main.tsx supplies BrowserRouter), so the tests supply their own.

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

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  )
}

// The sidebar navigates with real links now, so these are anchors rather than buttons.
function gotoView(user: ReturnType<typeof userEvent.setup>, name: 'Recipes' | 'Grocery Lists') {
  return user.click(screen.getByRole('link', { name }))
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
    renderApp()

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
    renderApp()

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
    renderApp()

    await gotoView(user, 'Recipes')
    await screen.findByText('Pasta')
    await screen.findByText('Salad')

    // Select both recipes, then merge.
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(checkboxes[1])
    await user.click(screen.getByRole('button', { name: 'Merge' }))

    expect(await screen.findByText(/merged!/i)).toBeInTheDocument()

    // The merged list lives in the shared grocery-list state, so it is there when we navigate.
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
    renderApp()

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
    renderApp()

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
    renderApp()

    await gotoView(user, 'Recipes')
    expect(await screen.findByText(/couldn't load recipes/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Pasta')).toBeInTheDocument()
  })
})

// Every screen has its own URL now, which is what makes these possible at all — before the router,
// the app rendered whatever `view` state said and the address bar never moved.
describe('routing', () => {
  it('opens a deep link straight to the page, without passing through Home', async () => {
    seedSession()
    installApi([okSession, okRecipes, okGroceryEmpty])
    renderApp('/recipes')

    expect(await screen.findByText('Pasta')).toBeInTheDocument()
    expect(screen.queryByText(/AI-powered grocery assistant/i)).not.toBeInTheDocument()
  })

  it('sends an unauthenticated deep link through login and back to where it was headed', async () => {
    const user = userEvent.setup()
    installApi([
      { method: 'POST', match: '/api/auth/login', respond: { body: auth } },
      okRecipes,
      okGroceryEmpty,
    ])
    renderApp('/recipes')

    // The guard bounced us to the login screen…
    expect(await screen.findByText('Sign in to continue')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'ada@example.com')
    await user.type(screen.getByLabelText('Password'), 'supersecret')
    const submit = screen.getAllByRole('button').find(b => b.getAttribute('type') === 'submit')!
    await user.click(submit)

    // …and signing in returns us to /recipes rather than dumping us on Home.
    expect(await screen.findByText('Pasta')).toBeInTheDocument()
  })

  it('redirects an unknown path to Home', async () => {
    seedSession()
    installApi([okSession, okRecipes, okGroceryEmpty])
    renderApp('/does-not-exist')

    expect(await screen.findByText(/AI-powered grocery assistant/i)).toBeInTheDocument()
  })
})