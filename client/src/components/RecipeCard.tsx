import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react'
import { AlertBanner } from './AlertBanner'

type Status = 'idle' | 'loading' | 'success' | 'error'

const CHIPS = [
  { emoji: '🍝', label: 'Spaghetti Carbonara' },
  { emoji: '🍛', label: 'Chicken Curry' },
  { emoji: '🥗', label: 'Vegan Buddha Bowl' },
  { emoji: '🌮', label: 'Tacos' },
  { emoji: '🍣', label: 'Sushi Bowl' },
]

const PLACEHOLDERS = [
  'Paste a recipe…',
  'Chicken curry with rice for 4 people…',
  'Paella',
  'Vegan pasta bake…',
]

export function RecipeCard() {
  const [input, setInput] = useState('')
  const [validationError, setValidationError] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  useEffect(() => {
    if (input) return
    const id = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(id)
  }, [input])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (validationError) setValidationError('')
  }

  const handleChip = (label: string) => {
    setInput(label)
    setValidationError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) {
      setValidationError('Please enter a recipe name or paste a recipe.')
      return
    }
    setStatus('loading')
    setIngredients([])
    try {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish: trimmed }),
      })
      if (!response.ok) throw new Error('Request failed')
      const data = await response.json() as { dish: string; ingredients: string[] }
      setIngredients(data.ingredients)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-2xl border border-gray-200/60 dark:border-gray-700/40 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 p-8"
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Label row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <ChefHat size={16} className="text-[#2d6a4f] dark:text-green-400" />
            Recipe or meal idea
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
            {input.length} / 1000
          </span>
        </div>

        {/* Textarea */}
        <textarea
          id="recipe-input"
          value={input}
          onChange={handleChange}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={8}
          maxLength={1000}
          className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-gray-800 dark:text-gray-200 bg-gray-50/60 dark:bg-gray-900/50 resize-none outline-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 ${
            validationError
              ? 'border-red-300 dark:border-red-700 ring-2 ring-red-500/20'
              : 'border-gray-200 dark:border-gray-700 focus:border-[#2d6a4f]/70 dark:focus:border-green-500/60 focus:ring-2 focus:ring-[#2d6a4f]/15'
          }`}
        />

        {/* Example chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {CHIPS.map(({ emoji, label }) => (
            <motion.button
              key={label}
              type="button"
              onClick={() => handleChip(label)}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-[#40916c] dark:hover:border-green-600 hover:text-[#2d6a4f] dark:hover:text-green-400 hover:bg-green-50/60 dark:hover:bg-green-900/20 transition-colors bg-white dark:bg-gray-800"
            >
              <span>{emoji}</span>
              {label}
            </motion.button>
          ))}
        </div>

        {/* Validation alert */}
        <div className="mt-4">
          <AlertBanner
            type="validation"
            message={validationError}
            visible={!!validationError}
          />
          <AlertBanner
            type="error"
            message="Something went wrong. Please try again."
            visible={status === 'error' && !validationError}
          />
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={status === 'loading'}
          whileHover={status !== 'loading' ? { y: -2 } : {}}
          whileTap={status !== 'loading' ? { scale: 0.98, y: 0 } : {}}
          transition={{ duration: 0.15 }}
          style={status !== 'loading' ? undefined : undefined}
          className="mt-4 w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] text-white font-semibold text-sm shadow-lg shadow-green-900/25 hover:shadow-green-900/35 disabled:opacity-60 disabled:cursor-not-allowed transition-shadow duration-200"
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              Generate shopping list
              <ArrowRight size={15} />
            </>
          )}
        </motion.button>
      </form>

      {/* Results */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/50"
          >
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ShoppingCart size={15} className="text-[#2d6a4f] dark:text-green-400" />
              Shopping list
            </h2>
            {ingredients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {ingredients.map((item, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/60 text-green-800 dark:text-green-300"
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No ingredients returned yet.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
