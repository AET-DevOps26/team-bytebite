import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, ChevronDown, ShoppingBag, Plus, Pencil,
  Check, Copy, Trash2, CircleCheckBig, X, Loader2, AlertTriangle,
} from 'lucide-react'
import type { GroceryListSummary, GroceryItemDetail, EditableItem, LoadStatus } from '../types'
import { ItemListForm } from '../components/ItemListForm'

type ItemState = { status: LoadStatus; items: GroceryItemDetail[] }

// The modal is either creating a new list or editing an existing one (seeded with its items).
type FormMode =
  | { kind: 'create' }
  | { kind: 'edit'; id: string; name: string; items: EditableItem[] }

interface GroceryListsPageProps {
  lists: GroceryListSummary[]
  status: LoadStatus
  onRetry: () => void
  onToggleItem: (listId: string, itemId: string, purchased: boolean) => Promise<boolean>
  onDeleteList: (listId: string) => void
  onCreateList: (name: string, items: EditableItem[]) => Promise<boolean>
  onUpdateList: (id: string, name: string, items: EditableItem[]) => Promise<GroceryItemDetail[] | null>
  fetchItems: (id: string) => Promise<GroceryItemDetail[]>
}

function itemLabel(item: GroceryItemDetail) {
  return item.quantity !== 'N/A' ? `${item.quantity} ${item.unit} ${item.name}` : item.name
}

function toText(dish: string, items: GroceryItemDetail[]) {
  return [dish, ...items.map(item => `- ${itemLabel(item)}`)].join('\n')
}

// Grocery items carry their purchased flag into the editor so it survives an edit (the PUT
// replaces every item, so we resend the current flag for each surviving row).
function toEditable(item: GroceryItemDetail): EditableItem {
  return {
    name: item.name,
    quantity: item.quantity === 'N/A' ? '' : item.quantity,
    unit: item.unit,
    category: item.category,
    purchased: item.purchased,
  }
}

export function GroceryListsPage({
  lists, status, onRetry, onToggleItem, onDeleteList, onCreateList, onUpdateList, fetchItems,
}: GroceryListsPageProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<{ id: string; ok: boolean } | null>(null)
  const [itemsById, setItemsById] = useState<Record<string, ItemState>>({})
  const [formMode, setFormMode] = useState<FormMode | null>(null)

  // Fetches a list's items (once), caches them, and returns them; throws on failure.
  const loadItems = async (id: string): Promise<GroceryItemDetail[]> => {
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

  // Flips one item's purchased flag in the cache, then persists; reverts if the server rejects it.
  const setPurchased = (listId: string, itemId: string, purchased: boolean) => {
    setItemsById(prev => {
      const st = prev[listId]
      if (!st) return prev
      return {
        ...prev,
        [listId]: { ...st, items: st.items.map(i => (i.itemId === itemId ? { ...i, purchased } : i)) },
      }
    })
  }

  const handleToggleItem = async (listId: string, item: GroceryItemDetail) => {
    const next = !item.purchased
    setPurchased(listId, item.itemId, next)
    const ok = await onToggleItem(listId, item.itemId, next)
    if (!ok) setPurchased(listId, item.itemId, item.purchased)
  }

  // Opens the editor for a list, loading its items first (from cache when available) so the form
  // starts prefilled and keeps each item's purchased state.
  const openEdit = async (list: GroceryListSummary) => {
    const cached = itemsById[list.id]
    try {
      const items = cached?.status === 'ready' ? cached.items : await loadItems(list.id)
      setFormMode({ kind: 'edit', id: list.id, name: list.dish, items: items.map(toEditable) })
    } catch { /* load failure is surfaced in the expanded card via item state */ }
  }

  const showCopyResult = (id: string, ok: boolean) => {
    setCopyState({ id, ok })
    setTimeout(() => setCopyState(s => (s?.id === id ? null : s)), 1800)
  }

  const handleCopy = async (list: GroceryListSummary) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      const cached = itemsById[list.id]
      const items = cached?.status === 'ready' ? cached.items : await loadItems(list.id)
      await navigator.clipboard.writeText(toText(list.dish, items))
      showCopyResult(list.id, true)
    } catch {
      showCopyResult(list.id, false)
    }
  }

  // Submits the editor: create prepends a new list; edit persists and reseeds the cached items.
  const handleSubmit = async (name: string, items: EditableItem[]): Promise<boolean> => {
    if (formMode?.kind === 'edit') {
      const updated = await onUpdateList(formMode.id, name, items)
      if (!updated) return false
      setItemsById(prev => ({ ...prev, [formMode.id]: { status: 'ready', items: updated } }))
      return true
    }
    return onCreateList(name, items)
  }

  const newListButton = (
    <button
      onClick={() => setFormMode({ kind: 'create' })}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] shadow-lg shadow-green-900/25 hover:shadow-green-900/35 transition-shadow"
    >
      <Plus size={15} /> New list
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
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading your grocery lists…</p>
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
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Couldn't load grocery lists</h2>
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
  } else if (lists.length === 0) {
    body = (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center py-32 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 flex items-center justify-center mb-5">
          <ShoppingBag size={28} className="text-[#2d6a4f] dark:text-green-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No grocery lists yet</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed mb-5">
          Merge recipes from the Recipes page, or add a list manually.
        </p>
        {newListButton}
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Grocery Lists</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 text-xs font-semibold text-green-800 dark:text-green-400">
              {lists.length}
            </span>
          </div>
          {newListButton}
        </div>

        <div className="space-y-3">
          {lists.map((list, idx) => {
            const isOpen = openId === list.id
            const state = itemsById[list.id]
            const loaded = state?.status === 'ready'
            // Collapsed cards rely on the summary counts; once items are loaded, the live
            // (optimistic) item state drives the progress so toggles update instantly.
            const total = loaded ? state.items.length : list.itemCount
            const checkedCount = loaded ? state.items.filter(item => item.purchased).length : list.purchasedCount
            const progress = total ? checkedCount / total : 0
            const complete = total > 0 && checkedCount === total

            const grouped = (loaded ? state.items : []).reduce<Record<string, GroceryItemDetail[]>>(
              (acc, item) => {
                const key = item.category || 'Other'
                ;(acc[key] ??= []).push(item)
                return acc
              },
              {}
            )

            return (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 rounded-2xl shadow-sm shadow-black/5 dark:shadow-black/20 overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-center px-5 py-4">
                  <button
                    onClick={() => toggle(list.id)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors ${
                      complete
                        ? 'bg-[#2d6a4f] border-[#2d6a4f] dark:bg-green-600 dark:border-green-600'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/40'
                    }`}>
                      {complete
                        ? <CircleCheckBig size={15} className="text-white" />
                        : <ShoppingCart size={15} className="text-[#2d6a4f] dark:text-green-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{list.dish}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(list.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        {' · '}
                        {complete ? 'Done' : `${checkedCount}/${total} picked up`}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-0.5 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(list)}
                      title={copyState?.id === list.id && !copyState.ok ? "Couldn't copy" : 'Copy list'}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {copyState?.id === list.id
                        ? (copyState.ok
                            ? <Check size={15} className="text-[#2d6a4f] dark:text-green-400" />
                            : <X size={15} className="text-red-600 dark:text-red-400" />)
                        : <Copy size={15} />}
                    </button>
                    <button
                      onClick={() => openEdit(list)}
                      title="Edit list"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteList(list.id)}
                      title="Delete list"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => toggle(list.id)}
                      title={isOpen ? 'Collapse' : 'Expand'}
                      className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}>
                        <ChevronDown size={16} />
                      </motion.div>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 pb-3">
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700/40 overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-[#1b5e38] to-[#40916c]"
                    />
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
                            Loading items…
                          </div>
                        )}

                        {state?.status === 'error' && (
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                              <AlertTriangle size={15} />
                              Couldn't load items.
                            </span>
                            <button
                              onClick={() => loadItems(list.id).catch(() => {})}
                              className="text-xs font-semibold text-[#2d6a4f] dark:text-green-400 hover:underline"
                            >
                              Retry
                            </button>
                          </div>
                        )}

                        {state?.status === 'ready' && (
                          state.items.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500">No items.</p>
                          ) : (
                            <div className="space-y-4">
                              {Object.entries(grouped).map(([category, items]) => (
                                <div key={category}>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                                    {category}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {items.map(item => {
                                      const checked = item.purchased
                                      return (
                                        <button
                                          key={item.itemId}
                                          onClick={() => handleToggleItem(list.id, item)}
                                          className={`flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                            checked
                                              ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white dark:bg-green-700 dark:border-green-700'
                                              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/60 text-green-800 dark:text-green-300 hover:border-[#40916c] dark:hover:border-green-600'
                                          }`}
                                        >
                                          <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border ${
                                            checked
                                              ? 'bg-white/20 border-white/40'
                                              : 'border-green-300 dark:border-green-700'
                                          }`}>
                                            {checked && <Check size={11} strokeWidth={3} className="text-white" />}
                                          </span>
                                          <span className={checked ? 'line-through opacity-90' : ''}>
                                            {itemLabel(item)}
                                          </span>
                                        </button>
                                      )
                                    })}
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
            title={formMode.kind === 'create' ? 'New grocery list' : 'Edit grocery list'}
            submitLabel={formMode.kind === 'create' ? 'Create list' : 'Save changes'}
            nameLabel="List name"
            namePlaceholder="e.g. Weekend shop"
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