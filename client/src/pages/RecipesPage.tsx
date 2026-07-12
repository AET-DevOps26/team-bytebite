import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChefHat, ChevronDown, BookOpen, Plus, Pencil,
  Check, Copy, Trash2, X, Loader2, AlertTriangle, Combine,
} from 'lucide-react'
import type { RecipeSummary, Ingredient, EditableItem, LoadStatus } from '../types'
import { AlertBanner } from '../components/AlertBanner'
import { ItemListForm } from '../components/ItemListForm'

type ItemState = { status: LoadStatus; items: Ingredient[] }

// The modal is either creating a new recipe or editing an existing one (seeded with its items).
type FormMode =
  | { kind: 'create' }
  | { kind: 'edit'; id: string; name: string; items: EditableItem[] }

interface RecipesPageProps {
  recipes: RecipeSummary[]
  status: LoadStatus
  onRetry: () => void
  onDeleteRecipe: (id: string) => void
  onCreateRecipe: (name: string, items: EditableItem[]) => Promise<boolean>
  onUpdateRecipe: (id: string, name: string, items: EditableItem[]) => Promise<Ingredient[] | null>
  fetchItems: (id: string) => Promise<Ingredient[]>
  onMerge: (recipeIds: string[]) => Promise<boolean>
}

function itemLabel(item: Ingredient) {
  return item.quantity !== 'N/A' ? `${item.quantity} ${item.unit} ${item.name}` : item.name
}

function toText(dish: string, items: Ingredient[]) {
  return [dish, ...items.map(item => `- ${itemLabel(item)}`)].join('\n')
}

// Recipe items map straight onto the editor's rows ('N/A' quantity becomes an empty field).
function toEditable(item: Ingredient): EditableItem {
  return { name: item.name, quantity: item.quantity === 'N/A' ? '' : item.quantity, unit: item.unit, category: item.category }
}

export function RecipesPage({
  recipes, status, onRetry, onDeleteRecipe, onCreateRecipe, onUpdateRecipe, fetchItems, onMerge,
}: RecipesPageProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<{ id: string; ok: boolean } | null>(null)
  const [itemsById, setItemsById] = useState<Record<string, ItemState>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [merging, setMerging] = useState(false)
  const [mergeResult, setMergeResult] = useState<'success' | 'error' | null>(null)
  const [formMode, setFormMode] = useState<FormMode | null>(null)

  const toggleSelect = (id: string) => {
    setMergeResult(null)
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Merges the selected recipes (needs at least two) into a new grocery list.
  const handleMerge = async () => {
    if (selected.size < 2 || merging) return
    setMerging(true)
    setMergeResult(null)
    const ok = await onMerge([...selected])
    setMerging(false)
    setMergeResult(ok ? 'success' : 'error')
    if (ok) setSelected(new Set())
  }

  // Fetches a recipe's items (once), caches them, and returns them; throws on failure.
  const loadItems = async (id: string): Promise<Ingredient[]> => {
    setItemsById(prev => ({ ...prev, [id]: { status: 'loading', items: prev[id]?.items ?? [] } }))
    try {
      const items = await fetchItems(id)
      setItemsById(prev => ({ ...prev, [id]: { status: 'ready', items } }))
      return items
    } catch (error) {
      setItemsById(prev => ({ ...prev, [id]: { status: 'error', items: [] } }))
      throw error
    }
  }

  const toggle = (id: string) => {
    if (openId === id) {
      setOpenId(null)
      return
    }
    setOpenId(id)
    const st = itemsById[id]?.status
    if (st !== 'ready' && st !== 'loading') {
      loadItems(id).catch(() => { /* surfaced via item state */ })
    }
  }

  // Opens the editor for a recipe, loading its items first (from cache when available) so the
  // form starts prefilled.
  const openEdit = async (recipe: RecipeSummary) => {
    const cached = itemsById[recipe.id]
    try {
      const items = cached?.status === 'ready' ? cached.items : await loadItems(recipe.id)
      setFormMode({ kind: 'edit', id: recipe.id, name: recipe.dish, items: items.map(toEditable) })
    } catch { /* load failure is surfaced in the expanded card via item state */ }
  }

  const showCopyResult = (id: string, ok: boolean) => {
    setCopyState({ id, ok })
    setTimeout(() => setCopyState(s => (s?.id === id ? null : s)), 1800)
  }

  const handleCopy = async (recipe: RecipeSummary) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      const cached = itemsById[recipe.id]
      const items = cached?.status === 'ready' ? cached.items : await loadItems(recipe.id)
      await navigator.clipboard.writeText(toText(recipe.dish, items))
      showCopyResult(recipe.id, true)
    } catch {
      showCopyResult(recipe.id, false)
    }
  }

  // Submits the editor: create prepends a new recipe; edit persists and reseeds the cached items.
  const handleSubmit = async (name: string, items: EditableItem[]): Promise<boolean> => {
    if (formMode?.kind === 'edit') {
      const updated = await onUpdateRecipe(formMode.id, name, items)
      if (!updated) return false
      setItemsById(prev => ({ ...prev, [formMode.id]: { status: 'ready', items: updated } }))
      return true
    }
    return onCreateRecipe(name, items)
  }

  const newRecipeButton = (
    <button
      onClick={() => setFormMode({ kind: 'create' })}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] shadow-lg shadow-green-900/25 hover:shadow-green-900/35 transition-shadow"
    >
      <Plus size={15} /> New recipe
    </button>
  )

  let body: React.ReactNode

  if (status === 'loading') {
    body = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-32 text-center"
      >
        <Loader2 size={28} className="text-[#2d6a4f] dark:text-green-400 animate-spin mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading your recipes…</p>
      </motion.div>
    )
  } else if (status === 'error') {
    body = (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center py-32 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 flex items-center justify-center mb-5">
          <AlertTriangle size={26} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Couldn't load recipes</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-5">
          Something went wrong reaching the server. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] text-white font-semibold text-sm shadow-lg shadow-green-900/25 hover:shadow-green-900/35 transition-shadow"
        >
          Try again
        </button>
      </motion.div>
    )
  } else if (recipes.length === 0) {
    body = (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center py-32 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 flex items-center justify-center mb-5">
          <BookOpen size={28} className="text-[#2d6a4f] dark:text-green-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No recipes yet</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-5">
          Generate a recipe from the Home page, or add one manually.
        </p>
        {newRecipeButton}
      </motion.div>
    )
  } else {
    body = (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recipes</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 text-xs font-semibold text-green-800 dark:text-green-400">
              {recipes.length}
            </span>
          </div>
          {newRecipeButton}
        </div>

        {/* Merge bar: select recipes via their checkboxes, then merge into one grocery list. */}
        <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/80 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selected.size === 0
              ? 'Select recipes to merge into a grocery list'
              : `${selected.size} selected`}
          </p>
          <button
            onClick={handleMerge}
            disabled={selected.size < 2 || merging}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] shadow-lg shadow-green-900/25 hover:shadow-green-900/35 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {merging
              ? <><Loader2 size={15} className="animate-spin" /> Merging…</>
              : <><Combine size={15} /> Merge</>}
          </button>
        </div>

        <div className="mb-4">
          <AlertBanner
            type="success"
            message="Merged! You can view the new grocery list in the Grocery Lists tab now."
            visible={mergeResult === 'success'}
          />
          <AlertBanner
            type="error"
            message="Couldn't merge the selected recipes. Please try again."
            visible={mergeResult === 'error'}
          />
        </div>

        <div className="space-y-3">
          {recipes.map((recipe, idx) => {
            const isOpen = openId === recipe.id
            const state = itemsById[recipe.id]

            const grouped = (state?.status === 'ready' ? state.items : []).reduce<Record<string, Ingredient[]>>(
              (acc, item) => {
                const key = item.category || 'Other'
                ;(acc[key] ??= []).push(item)
                return acc
              },
              {}
            )

            return (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 rounded-2xl shadow-sm shadow-black/5 dark:shadow-black/20 overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center px-5 py-4">
                  <button
                    onClick={() => toggleSelect(recipe.id)}
                    role="checkbox"
                    aria-checked={selected.has(recipe.id)}
                    title={selected.has(recipe.id) ? 'Deselect recipe' : 'Select to merge'}
                    className={`mr-3 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected.has(recipe.id)
                        ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#2d6a4f] dark:hover:border-green-400'
                    }`}
                  >
                    {selected.has(recipe.id) && <Check size={13} />}
                  </button>
                  <button
                    onClick={() => toggle(recipe.id)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 flex items-center justify-center flex-shrink-0">
                      <ChefHat size={15} className="text-[#2d6a4f] dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{recipe.dish}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(recipe.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        {state?.status === 'ready' ? ` · ${state.items.length} ingredients` : ''}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-0.5 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(recipe)}
                      title={copyState?.id === recipe.id && !copyState.ok ? "Couldn't copy" : 'Copy recipe'}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {copyState?.id === recipe.id
                        ? (copyState.ok
                            ? <Check size={15} className="text-[#2d6a4f] dark:text-green-400" />
                            : <X size={15} className="text-red-600 dark:text-red-400" />)
                        : <Copy size={15} />}
                    </button>
                    <button
                      onClick={() => openEdit(recipe)}
                      title="Edit recipe"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteRecipe(recipe.id)}
                      title="Delete recipe"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => toggle(recipe.id)}
                      title={isOpen ? 'Collapse' : 'Expand'}
                      className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}>
                        <ChevronDown size={16} />
                      </motion.div>
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.section
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700/50 pt-4">
                        {state?.status === 'loading' && (
                          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                            <Loader2 size={15} className="animate-spin" />
                            Loading ingredients…
                          </div>
                        )}

                        {state?.status === 'error' && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                              <AlertTriangle size={15} />
                              Couldn't load ingredients.
                            </span>
                            <button
                              onClick={() => loadItems(recipe.id).catch(() => {})}
                              className="text-xs font-semibold text-[#2d6a4f] dark:text-green-400 hover:underline"
                            >
                              Retry
                            </button>
                          </div>
                        )}

                        {state?.status === 'ready' && (
                          state.items.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500">No ingredients.</p>
                          ) : (
                            <div className="space-y-4">
                              {Object.entries(grouped).map(([category, items]) => (
                                <div key={category}>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                                    {category}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {items.map((item, i) => (
                                      <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/60 text-green-800 dark:text-green-300"
                                      >
                                        {itemLabel(item)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {body}
      <AnimatePresence>
        {formMode && (
          <ItemListForm
            title={formMode.kind === 'create' ? 'New recipe' : 'Edit recipe'}
            submitLabel={formMode.kind === 'create' ? 'Create recipe' : 'Save changes'}
            nameLabel="Recipe name"
            namePlaceholder="e.g. Spaghetti Bolognese"
            initialName={formMode.kind === 'edit' ? formMode.name : ''}
            initialItems={formMode.kind === 'edit' ? formMode.items : []}
            onSubmit={handleSubmit}
            onClose={() => setFormMode(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}