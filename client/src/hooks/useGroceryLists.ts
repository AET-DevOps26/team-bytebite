import { useCallback, useState } from 'react'
import { useApi } from '../contexts/authContext'
import { ApiError } from '../lib/api'
import {
  apiItemsToGroceryDetail, apiSummaryToGroceryList, detailToGrocerySummary, toGroceryItemPayload,
} from '../lib/mappers'
import type {
  ApiGroceryList, ApiGroceryListSummary, EditableItem, GroceryItemDetail, GroceryListSummary,
  LlmProvider, LoadStatus,
} from '../types'

// Owns the grocery-list collection. `merge` lives here rather than with the recipes because the
// list it produces belongs to this collection — the Recipes page only triggers it.
export function useGroceryLists() {
  const api = useApi()
  const [lists, setLists] = useState<GroceryListSummary[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await api.get<ApiGroceryListSummary[]>('/grocery-list')
      setLists(data.map(apiSummaryToGroceryList))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [api])

  const reset = useCallback(() => {
    setLists([])
    setStatus('loading')
  }, [])

  const fetchItems = useCallback(
    async (id: string): Promise<GroceryItemDetail[]> =>
      apiItemsToGroceryDetail(await api.get<ApiGroceryList>(`/grocery-list/${id}`)),
    [api]
  )

  const create = useCallback(async (name: string, items: EditableItem[]): Promise<boolean> => {
    try {
      const saved = await api.post<ApiGroceryList>('/grocery-list', { name, items: items.map(toGroceryItemPayload) })
      setLists(prev => [detailToGrocerySummary(saved), ...prev])
      return true
    } catch {
      return false
    }
  }, [api])

  // Replaces name and items. The PUT reassigns item ids, so the fresh items go back to the view
  // for it to reseed its cache; the summary counts are recomputed from the response.
  const update = useCallback(
    async (id: string, name: string, items: EditableItem[]): Promise<GroceryItemDetail[] | null> => {
      try {
        const saved = await api.put<ApiGroceryList>(`/grocery-list/${id}`, { name, items: items.map(toGroceryItemPayload) })
        setLists(prev => prev.map(list => (list.id === id ? detailToGrocerySummary(saved) : list)))
        return apiItemsToGroceryDetail(saved)
      } catch {
        return null
      }
    },
    [api]
  )

  const remove = useCallback((id: string) => {
    const previous = lists
    setLists(prev => prev.filter(list => list.id !== id))
    api.del(`/grocery-list/${id}`).catch(error => {
      if (error instanceof ApiError && error.status === 404) return
      setLists(previous)
    })
  }, [api, lists])

  // Merges recipes into a brand-new grocery list server-side and prepends it to the history.
  const merge = useCallback(async (recipeIds: string[], llmProvider: LlmProvider): Promise<boolean> => {
    try {
      const saved = await api.post<ApiGroceryList>('/grocery-list/merge', { recipeIds, llmProvider })
      setLists(prev => [detailToGrocerySummary(saved), ...prev])
      return true
    } catch {
      return false
    }
  }, [api])

  // Persists one item's picked-up state and keeps the summary counts in step. Returns false when
  // the server rejects it so the view can revert its own optimistic update.
  const toggleItem = useCallback(
    async (listId: string, itemId: string, purchased: boolean): Promise<boolean> => {
      const adjust = (delta: number) => setLists(prev => prev.map(list =>
        list.id === listId
          ? { ...list, purchasedCount: Math.max(0, Math.min(list.itemCount, list.purchasedCount + delta)) }
          : list
      ))
      adjust(purchased ? 1 : -1)
      try {
        await api.patch(`/grocery-list/${listId}/items/${itemId}`, { purchased })
        return true
      } catch {
        adjust(purchased ? -1 : 1)
        return false
      }
    },
    [api]
  )

  return { lists, status, load, reset, fetchItems, create, update, remove, merge, toggleItem }
}
