import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import { Sidebar, LogoMark } from './components/Sidebar'
import { HeroSection } from './components/HeroSection'
import { RecipeCard } from './components/RecipeCard'
import { FeatureCards } from './components/FeatureCards'
import { AuthCard, type AuthPayload, type AuthUser } from './components/AuthCard'
import { GroceryListView } from './components/GroceryListView'
import { RecipeListView } from './components/RecipeListView'
import type {
  GroceryList, ApiRecipe, ApiRecipeSummary, RecipeSummary, Ingredient,
  ApiGroceryList, ApiGroceryListSummary, GroceryListSummary, GroceryItemDetail,
} from './types'

type View = 'home' | 'grocery-lists' | 'recipes'
type LoadStatus = 'loading' | 'ready' | 'error'

function apiSummaryToRecipe(summary: ApiRecipeSummary): RecipeSummary {
  return { id: summary.recipeId, dish: summary.name, createdAt: summary.createdAt }
}

// The API uses the DB's numeric quantity (null = unspecified); the client keeps a display
// string, so convert at the API boundary.
function formatQuantity(quantity: number | null): string {
  return quantity === null ? 'N/A' : String(quantity)
}

function parseQuantity(quantity: string): number | null {
  const trimmed = quantity?.trim()
  if (!trimmed || trimmed === 'N/A') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function apiItemsToIngredients(recipe: ApiRecipe): Ingredient[] {
  return recipe.items.map(item => ({
    name: item.name,
    quantity: formatQuantity(item.quantity),
    unit: item.unit,
    category: item.category,
  }))
}

function apiSummaryToGroceryList(summary: ApiGroceryListSummary): GroceryListSummary {
  return {
    id: summary.groceryListId,
    dish: summary.name,
    createdAt: summary.createdAt,
    itemCount: summary.itemCount,
    purchasedCount: summary.purchasedCount,
  }
}

// POST/PUT return the full detail; derive the summary counts the list view needs from it.
function detailToGrocerySummary(detail: ApiGroceryList): GroceryListSummary {
  return {
    id: detail.groceryListId,
    dish: detail.name,
    createdAt: detail.createdAt,
    itemCount: detail.items.length,
    purchasedCount: detail.items.filter(item => item.purchased).length,
  }
}

function apiItemsToGroceryDetail(list: ApiGroceryList): GroceryItemDetail[] {
  return list.items.map(item => ({
    itemId: item.itemId,
    name: item.name,
    quantity: formatQuantity(item.quantity),
    unit: item.unit,
    category: item.category,
    purchased: item.purchased,
  }))
}

function getInitialDark(): boolean {
  const stored = localStorage.getItem('bytebite-dark')
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function App() {
  const [darkMode, setDarkMode] = useState(getInitialDark)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<View>('home')
  const [token, setToken] = useState(() => localStorage.getItem('bytebite-token') ?? '')
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('bytebite-user')
    return stored ? JSON.parse(stored) as AuthUser : null
  })
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [recipesStatus, setRecipesStatus] = useState<LoadStatus>('loading')
  const [groceryLists, setGroceryLists] = useState<GroceryListSummary[]>([])
  const [groceryStatus, setGroceryStatus] = useState<LoadStatus>('loading')

  const loadRecipes = useCallback((authToken: string) => {
    setRecipesStatus('loading')
    fetch('/api/recipes', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(response => {
        if (!response.ok) throw new Error('Failed to load recipes')
        return response.json() as Promise<ApiRecipeSummary[]>
      })
      .then(data => {
        setRecipes(data.map(apiSummaryToRecipe))
        setRecipesStatus('ready')
      })
      .catch(() => setRecipesStatus('error'))
  }, [])

  const loadGroceryLists = useCallback((authToken: string) => {
    setGroceryStatus('loading')
    fetch('/api/grocery-list', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(response => {
        if (!response.ok) throw new Error('Failed to load grocery lists')
        return response.json() as Promise<ApiGroceryListSummary[]>
      })
      .then(data => {
        setGroceryLists(data.map(apiSummaryToGroceryList))
        setGroceryStatus('ready')
      })
      .catch(() => setGroceryStatus('error'))
  }, [])

  const fetchRecipeItems = useCallback(async (recipeId: string): Promise<Ingredient[]> => {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to load recipe items')
    return apiItemsToIngredients(await response.json() as ApiRecipe)
  }, [token])

  const fetchGroceryListItems = useCallback(async (listId: string): Promise<GroceryItemDetail[]> => {
    const response = await fetch(`/api/grocery-list/${listId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to load grocery list items')
    return apiItemsToGroceryDetail(await response.json() as ApiGroceryList)
  }, [token])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('bytebite-dark', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    if (!token) return
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => {
        if (!response.ok) throw new Error('Session expired')
        return response.json() as Promise<AuthPayload>
      })
      .then(payload => {
        setToken(payload.token)
        setUser(payload.user)
        localStorage.setItem('bytebite-token', payload.token)
        localStorage.setItem('bytebite-user', JSON.stringify(payload.user))
        loadRecipes(payload.token)
        loadGroceryLists(payload.token)
      })
      .catch(() => {
        localStorage.removeItem('bytebite-token')
        localStorage.removeItem('bytebite-user')
        setToken('')
        setUser(null)
      })
  }, [loadRecipes, loadGroceryLists])

  const toggleDark = () => setDarkMode(d => !d)
  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  const navigate = (v: string) => {
    setView(v as View)
    setSidebarOpen(false)
  }

  const handleAuthenticated = (payload: AuthPayload) => {
    setToken(payload.token)
    setUser(payload.user)
    localStorage.setItem('bytebite-token', payload.token)
    localStorage.setItem('bytebite-user', JSON.stringify(payload.user))
    loadRecipes(payload.token)
    loadGroceryLists(payload.token)
  }

  const handleLogout = () => {
    localStorage.removeItem('bytebite-token')
    localStorage.removeItem('bytebite-user')
    setToken('')
    setUser(null)
    setRecipes([])
    setGroceryLists([])
    setView('home')
  }

  // A generated dish is persisted as both a recipe and a grocery list; each view reads its own resource.
  const handleListGenerated = (list: GroceryList) => {
    if (!token) return

    fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: list.dish,
        items: list.ingredients.map(item => ({
          name: item.name,
          quantity: parseQuantity(item.quantity),
          unit: item.unit,
          category: item.category,
        })),
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to save recipe')
        return response.json() as Promise<ApiRecipe>
      })
      .then(saved => setRecipes(prev => [apiSummaryToRecipe(saved), ...prev]))
      .catch(() => {
        // Recipe persistence failed; the grocery list may still be saved.
      })

    fetch('/api/grocery-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: list.dish,
        items: list.ingredients.map(item => ({
          name: item.name,
          quantity: parseQuantity(item.quantity),
          unit: item.unit,
          category: item.category,
          purchased: false,
        })),
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to save grocery list')
        return response.json() as Promise<ApiGroceryList>
      })
      .then(saved => setGroceryLists(prev => [detailToGrocerySummary(saved), ...prev]))
      .catch(() => {
        // Grocery-list persistence failed; the recipe may still be saved.
      })
  }

  const handleDeleteRecipe = (recipeId: string) => {
    const previous = recipes
    setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId))
    fetch(`/api/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => {
        if (!response.ok && response.status !== 404) throw new Error('Failed to delete recipe')
      })
      .catch(() => setRecipes(previous))
  }

  // Persists a single item's picked-up state via PATCH and keeps the summary counts in sync.
  // Returns false if the server rejected the change so the view can revert its optimistic update.
  const handleToggleGroceryItem = useCallback(
    async (listId: string, itemId: string, purchased: boolean): Promise<boolean> => {
      const adjust = (delta: number) => setGroceryLists(prev => prev.map(list =>
        list.id === listId
          ? { ...list, purchasedCount: Math.max(0, Math.min(list.itemCount, list.purchasedCount + delta)) }
          : list
      ))
      adjust(purchased ? 1 : -1)
      try {
        const response = await fetch(`/api/grocery-list/${listId}/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ purchased }),
        })
        if (!response.ok) throw new Error('Failed to update item')
        return true
      } catch {
        adjust(purchased ? -1 : 1)
        return false
      }
    },
    [token]
  )

  const handleDeleteList = (listId: string) => {
    const previous = groceryLists
    setGroceryLists(prev => prev.filter(list => list.id !== listId))
    fetch(`/api/grocery-list/${listId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(response => {
        if (!response.ok && response.status !== 404) throw new Error('Failed to delete grocery list')
      })
      .catch(() => setGroceryLists(previous))
  }

  if (!token || !user) {
    return <AuthCard onAuthenticated={handleAuthenticated} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8f4] dark:bg-[#0c1410] dot-grid">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={toggleDark}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        user={user}
        onLogout={handleLogout}
        activeView={view}
        onNavigate={navigate}
      />

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSidebar}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:ml-64 [scrollbar-gutter:stable]">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
          <button
            onClick={openSidebar}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={18} />
          </button>
          <LogoMark scale="sm" />
        </div>

        {/* Page content */}
        <div className="max-w-2xl mx-auto px-6 py-16">
          <AnimatePresence mode="wait">
            {view === 'grocery-lists' ? (
              <motion.div
                key="grocery-lists"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <GroceryListView
                  lists={groceryLists}
                  status={groceryStatus}
                  onRetry={() => loadGroceryLists(token)}
                  onToggleItem={handleToggleGroceryItem}
                  onDeleteList={handleDeleteList}
                  fetchItems={fetchGroceryListItems}
                />
              </motion.div>
            ) : view === 'recipes' ? (
              <motion.div
                key="recipes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <RecipeListView
                  recipes={recipes}
                  status={recipesStatus}
                  onRetry={() => loadRecipes(token)}
                  onDeleteRecipe={handleDeleteRecipe}
                  fetchItems={fetchRecipeItems}
                />
              </motion.div>
            ) : (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <HeroSection />
                <RecipeCard token={token} onListGenerated={handleListGenerated} />
                <FeatureCards />
                <p className="mt-16 text-center text-xs text-gray-400 dark:text-gray-600">
                  ByteBite · AI-powered grocery assistant
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App