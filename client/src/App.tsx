import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAuth } from './components/layout/RequireAuth'
import { AuthProvider } from './contexts/AuthProvider'
import { useAuth } from './contexts/authContext'
import { useDarkMode } from './hooks/useDarkMode'
import { useGroceryLists } from './hooks/useGroceryLists'
import { useLlmProvider } from './hooks/useLlmProvider'
import { useRecipes } from './hooks/useRecipes'
import { GroceryListsPage } from './pages/GroceryListsPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RecipesPage } from './pages/RecipesPage'

// Holds the state the pages share — the two collections and the LLM choice — and hands each route
// exactly the slice it needs. Everything else (the session, the API, page chrome) lives in the
// provider, the hooks, and the layout.
function AppRoutes() {
  const { status } = useAuth()
  const { darkMode, toggleDark } = useDarkMode()
  const { llmProvider, setLlmProvider } = useLlmProvider()
  const recipes = useRecipes()
  const groceryLists = useGroceryLists()

  const { load: loadRecipes, reset: resetRecipes } = recipes
  const { load: loadGroceryLists, reset: resetGroceryLists } = groceryLists

  // Both collections belong to the session: they load once it is confirmed (a fresh sign-in or a
  // revalidated token) and are dropped when it ends, so a second sign-in cannot show stale data.
  useEffect(() => {
    if (status === 'authenticated') {
      loadRecipes()
      loadGroceryLists()
    } else if (status === 'anonymous') {
      resetRecipes()
      resetGroceryLists()
    }
  }, [status, loadRecipes, loadGroceryLists, resetRecipes, resetGroceryLists])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout darkMode={darkMode} onToggleDark={toggleDark} />}>
          <Route
            index
            element={
              <HomePage
                llmProvider={llmProvider}
                onLlmProviderChange={setLlmProvider}
                onListGenerated={list => recipes.create(list.dish, list.ingredients)}
              />
            }
          />
          <Route
            path="recipes"
            element={
              <RecipesPage
                recipes={recipes.recipes}
                status={recipes.status}
                onRetry={recipes.load}
                onDeleteRecipe={recipes.remove}
                onCreateRecipe={recipes.create}
                onUpdateRecipe={recipes.update}
                fetchItems={recipes.fetchItems}
                onMerge={recipeIds => groceryLists.merge(recipeIds, llmProvider)}
              />
            }
          />
          <Route
            path="grocery-lists"
            element={
              <GroceryListsPage
                lists={groceryLists.lists}
                status={groceryLists.status}
                onRetry={groceryLists.load}
                onToggleItem={groceryLists.toggleItem}
                onDeleteList={groceryLists.remove}
                onCreateList={groceryLists.create}
                onUpdateList={groceryLists.update}
                fetchItems={groceryLists.fetchItems}
              />
            }
          />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
