import { useCallback, useState } from 'react'
import { useApi } from '../contexts/authContext'
import { ApiError } from '../lib/api'
import { apiItemsToIngredients, apiSummaryToRecipe, toRecipeItemPayload } from '../lib/mappers'
import type {
  ApiRecipe, ApiRecipeSummary, EditableItem, Ingredient, LoadStatus, RecipeSummary,
} from '../types'

// Owns the recipe collection: the summaries the list view renders, plus every call that mutates
// them. The page components stay presentational and receive these as props.
export function useRecipes() {
  const api = useApi()
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await api.get<ApiRecipeSummary[]>('/recipes')
      setRecipes(data.map(apiSummaryToRecipe))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [api])

  // Clears the collection when the session ends, so a second sign-in never shows the first user's data.
  const reset = useCallback(() => {
    setRecipes([])
    setStatus('loading')
  }, [])

  // Items are fetched per recipe, on demand — the summary endpoint does not carry them.
  const fetchItems = useCallback(
    async (id: string): Promise<Ingredient[]> => apiItemsToIngredients(await api.get<ApiRecipe>(`/recipes/${id}`)),
    [api]
  )

  const create = useCallback(async (name: string, items: EditableItem[]): Promise<boolean> => {
    try {
      const saved = await api.post<ApiRecipe>('/recipes', { name, items: items.map(toRecipeItemPayload) })
      setRecipes(prev => [apiSummaryToRecipe(saved), ...prev])
      return true
    } catch {
      return false
    }
  }, [api])

  // Replaces name and items. Returns the fresh items so the view can reseed its cached detail.
  const update = useCallback(
    async (id: string, name: string, items: EditableItem[]): Promise<Ingredient[] | null> => {
      try {
        const saved = await api.put<ApiRecipe>(`/recipes/${id}`, { name, items: items.map(toRecipeItemPayload) })
        setRecipes(prev => prev.map(recipe => (recipe.id === id ? apiSummaryToRecipe(saved) : recipe)))
        return apiItemsToIngredients(saved)
      } catch {
        return null
      }
    },
    [api]
  )

  // Optimistic: drop the recipe now and put it back if the server refuses. A 404 means it was
  // already gone, which is the outcome we wanted anyway.
  const remove = useCallback((id: string) => {
    const previous = recipes
    setRecipes(prev => prev.filter(recipe => recipe.id !== id))
    api.del(`/recipes/${id}`).catch(error => {
      if (error instanceof ApiError && error.status === 404) return
      setRecipes(previous)
    })
  }, [api, recipes])

  return { recipes, status, load, reset, fetchItems, create, update, remove }
}
