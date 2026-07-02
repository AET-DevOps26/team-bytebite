import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import type { EditableItem } from '../types'

// The fixed grocery_category enum from the backend. Manual entry is constrained to these so a
// value can never fail to map server-side.
const GROCERY_CATEGORIES = [
  'PRODUCE', 'DAIRY', 'MEAT', 'SEAFOOD', 'BAKERY',
  'PANTRY', 'FROZEN', 'BEVERAGES', 'SPICES', 'OTHER',
] as const

function categoryLabel(category: string): string {
  return category.charAt(0) + category.slice(1).toLowerCase()
}

// Rows carry a stable client-side key so adding/removing doesn't shuffle React state, plus an
// opaque `purchased` we pass straight back through (grocery lists use it, recipes ignore it).
type Row = EditableItem & { key: string }

let rowSeq = 0
function toRow(item: EditableItem): Row {
  return {
    key: `row-${rowSeq++}`,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category || 'OTHER',
    purchased: item.purchased,
  }
}

function emptyRow(): Row {
  return toRow({ name: '', quantity: '', unit: '', category: 'OTHER' })
}

interface ItemListFormProps {
  title: string
  submitLabel: string
  nameLabel: string
  namePlaceholder: string
  initialName: string
  initialItems: EditableItem[]
  onSubmit: (name: string, items: EditableItem[]) => Promise<boolean>
  onClose: () => void
}

export function ItemListForm({
  title, submitLabel, nameLabel, namePlaceholder, initialName, initialItems, onSubmit, onClose,
}: ItemListFormProps) {
  const [name, setName] = useState(initialName)
  const [rows, setRows] = useState<Row[]>(() =>
    initialItems.length ? initialItems.map(toRow) : [emptyRow()]
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows(prev => prev.map(row => (row.key === key ? { ...row, ...patch } : row)))
  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (key: string) =>
    setRows(prev => (prev.length > 1 ? prev.filter(row => row.key !== key) : prev))

  const handleSubmit = async () => {
    if (submitting) return
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter a name.')
      return
    }
    // Rows with no name are treated as empty and dropped; quantity and unit stay optional.
    const items: EditableItem[] = rows
      .filter(row => row.name.trim())
      .map(row => ({
        name: row.name.trim(),
        quantity: row.quantity.trim(),
        unit: row.unit.trim(),
        category: row.category,
        purchased: row.purchased,
      }))
    if (items.length === 0) {
      setError('Add at least one item.')
      return
    }
    setError(null)
    setSubmitting(true)
    const ok = await onSubmit(trimmedName, items)
    setSubmitting(false)
    if (ok) onClose()
    else setError('Something went wrong. Please try again.')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => { if (!submitting) onClose() }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/50 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={() => { if (!submitting) onClose() }}
            title="Close"
            className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
              {nameLabel}
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={namePlaceholder}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40 focus:border-[#2d6a4f] transition"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Items
            </p>
            <div className="space-y-3">
              {rows.map(row => (
                <div
                  key={row.key}
                  className="rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-800/40 p-3 space-y-2.5"
                >
                  {/* Name spans its own line so it reads as the item's heading; the remove control
                      sits beside it. */}
                  <div className="flex items-center gap-2">
                    <input
                      value={row.name}
                      onChange={e => updateRow(row.key, { name: e.target.value })}
                      placeholder="Item name"
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40 focus:border-[#2d6a4f] transition"
                    />
                    <button
                      onClick={() => removeRow(row.key)}
                      disabled={rows.length === 1}
                      title="Remove item"
                      className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {/* Quantity, unit and category grouped together as the item's attributes. */}
                  <div className="grid grid-cols-6 gap-2">
                    <input
                      value={row.quantity}
                      onChange={e => updateRow(row.key, { quantity: e.target.value })}
                      placeholder="Qty"
                      inputMode="decimal"
                      className="col-span-3 sm:col-span-2 px-2.5 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40 focus:border-[#2d6a4f] transition"
                    />
                    <input
                      value={row.unit}
                      onChange={e => updateRow(row.key, { unit: e.target.value })}
                      placeholder="Unit"
                      className="col-span-3 sm:col-span-2 px-2.5 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40 focus:border-[#2d6a4f] transition"
                    />
                    <select
                      value={row.category}
                      onChange={e => updateRow(row.key, { category: e.target.value })}
                      className="col-span-6 sm:col-span-2 px-2.5 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/40 focus:border-[#2d6a4f] transition"
                    >
                      {GROCERY_CATEGORIES.map(category => (
                        <option key={category} value={category}>{categoryLabel(category)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#2d6a4f] dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <Plus size={15} /> Add item
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle size={15} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => { if (!submitting) onClose() }}
            className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] shadow-lg shadow-green-900/25 hover:shadow-green-900/35 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : submitLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}