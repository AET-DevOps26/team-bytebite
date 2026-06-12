import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, ChevronDown, ShoppingBag,
  Check, Copy, Trash2, CircleCheckBig, X,
} from 'lucide-react'
import type { GroceryList, Ingredient } from '../types'

interface GroceryListViewProps {
  lists: GroceryList[]
  onToggleItem: (listId: string, itemIndex: number) => void
  onDeleteList: (listId: string) => void
}

function itemLabel(item: Ingredient) {
  return item.quantity !== 'N/A' ? `${item.quantity} ${item.unit} ${item.name}` : item.name
}

function listToText(list: GroceryList) {
  const lines = [list.dish, ...list.ingredients.map(item => `- ${itemLabel(item)}`)]
  return lines.join('\n')
}

export function GroceryListView({ lists, onToggleItem, onDeleteList }: GroceryListViewProps) {
  const [openId, setOpenId] = useState<string | null>(lists[0]?.id ?? null)
  const [copyState, setCopyState] = useState<{ id: string; ok: boolean } | null>(null)

  const showCopyResult = (id: string, ok: boolean) => {
    setCopyState({ id, ok })
    setTimeout(() => setCopyState(s => (s?.id === id ? null : s)), 1800)
  }

  const handleCopy = async (list: GroceryList) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(listToText(list))
      showCopyResult(list.id, true)
    } catch {
      showCopyResult(list.id, false)
    }
  }

  if (lists.length === 0) {
    return (
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
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
          Generate a shopping list from a recipe on the Home page and it will appear here.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Grocery Lists</h1>
        <span className="px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 text-xs font-semibold text-green-800 dark:text-green-400">
          {lists.length}
        </span>
      </div>

      <div className="space-y-3">
        {lists.map((list, idx) => {
          const isOpen = openId === list.id
          const total = list.ingredients.length
          const checkedCount = list.ingredients.filter(item => item.checked).length
          const progress = total ? checkedCount / total : 0
          const complete = total > 0 && checkedCount === total

          const grouped = list.ingredients.reduce<Record<string, { item: Ingredient; index: number }[]>>(
            (acc, item, index) => {
              const key = item.category || 'Other'
              ;(acc[key] ??= []).push({ item, index })
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
                  onClick={() => setOpenId(isOpen ? null : list.id)}
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
                    onClick={() => onDeleteList(list.id)}
                    title="Delete list"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => setOpenId(isOpen ? null : list.id)}
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
                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700/50">
                      <div className="space-y-4 pt-4">
                        {Object.entries(grouped).map(([category, entries]) => (
                          <div key={category}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                              {category}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {entries.map(({ item, index }) => {
                                const checked = !!item.checked
                                return (
                                  <button
                                    key={index}
                                    onClick={() => onToggleItem(list.id, index)}
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