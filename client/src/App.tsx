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
import type { GroceryList, ApiRecipe } from './types'

type View = 'home' | 'grocery-lists' | 'recipes'
type RecipesStatus = 'loading' | 'ready' | 'error'

function apiRecipeToList(recipe: ApiRecipe): GroceryList {
  return {
    id: recipe.recipeId,
    dish: recipe.name,
    createdAt: recipe.createdAt,
    ingredients: recipe.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
    })),
  }
}

function getInitialDark(): boolean {
  const stored = localStorage.getItem('bytebite-dark')
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function loadLists(userId: string): GroceryList[] {
  const stored = localStorage.getItem(`bytebite-lists-${userId}`)
  return stored ? JSON.parse(stored) as GroceryList[] : []
}

function saveLists(userId: string, lists: GroceryList[]) {
  localStorage.setItem(`bytebite-lists-${userId}`, JSON.stringify(lists))
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
  const [savedLists, setSavedLists] = useState<GroceryList[]>(() =>
    user ? loadLists(user.userId) : []
  )
  const [recipes, setRecipes] = useState<GroceryList[]>([])
  const [recipesStatus, setRecipesStatus] = useState<RecipesStatus>('loading')

  const loadRecipes = useCallback((authToken: string) => {
    setRecipesStatus('loading')
    fetch('/api/recipes', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(response => {
        if (!response.ok) throw new Error('Failed to load recipes')
        return response.json() as Promise<ApiRecipe[]>
      })
      .then(data => {
        setRecipes(data.map(apiRecipeToList))
        setRecipesStatus('ready')
      })
      .catch(() => setRecipesStatus('error'))
  }, [])

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
        setSavedLists(loadLists(payload.user.userId))
        localStorage.setItem('bytebite-token', payload.token)
        localStorage.setItem('bytebite-user', JSON.stringify(payload.user))
        loadRecipes(payload.token)
      })
      .catch(() => {
        localStorage.removeItem('bytebite-token')
        localStorage.removeItem('bytebite-user')
        setToken('')
        setUser(null)
      })
  }, [loadRecipes])

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
    setSavedLists(loadLists(payload.user.userId))
    localStorage.setItem('bytebite-token', payload.token)
    localStorage.setItem('bytebite-user', JSON.stringify(payload.user))
    loadRecipes(payload.token)
  }

  const handleLogout = () => {
    localStorage.removeItem('bytebite-token')
    localStorage.removeItem('bytebite-user')
    setToken('')
    setUser(null)
    setSavedLists([])
    setRecipes([])
    setView('home')
  }

  const handleListGenerated = (list: GroceryList) => {
    if (!user) return
    // Grocery lists stay client-side for now; recipes are persisted server-side.
    setSavedLists(prev => {
      const next = [list, ...prev]
      saveLists(user.userId, next)
      return next
    })

    fetch('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: list.dish,
        items: list.ingredients.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        })),
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to save recipe')
        return response.json() as Promise<ApiRecipe>
      })
      .then(saved => setRecipes(prev => [apiRecipeToList(saved), ...prev]))
      .catch(() => {
        // Recipe persistence failed; the grocery list is still saved locally.
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

  const handleToggleItem = (listId: string, itemIndex: number) => {
    if (!user) return
    setSavedLists(prev => {
      const next = prev.map(list =>
        list.id === listId
          ? {
              ...list,
              ingredients: list.ingredients.map((item, i) =>
                i === itemIndex ? { ...item, checked: !item.checked } : item
              ),
            }
          : list
      )
      saveLists(user.userId, next)
      return next
    })
  }

  const handleDeleteList = (listId: string) => {
    if (!user) return
    setSavedLists(prev => {
      const next = prev.filter(list => list.id !== listId)
      saveLists(user.userId, next)
      return next
    })
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
                  lists={savedLists}
                  onToggleItem={handleToggleItem}
                  onDeleteList={handleDeleteList}
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
                  lists={recipes}
                  status={recipesStatus}
                  onRetry={() => loadRecipes(token)}
                  onDeleteList={handleDeleteRecipe}
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
