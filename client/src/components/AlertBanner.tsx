import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface AlertBannerProps {
  type: 'error' | 'success' | 'validation'
  message: string
  visible: boolean
}

export function AlertBanner({ type, message, visible }: AlertBannerProps) {
  const isError = type === 'error' || type === 'validation'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="alert"
          className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
            isError
              ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400'
              : 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800/60 text-green-700 dark:text-green-400'
          }`}
        >
          {isError
            ? <AlertCircle size={16} className="mt-0.5 shrink-0" />
            : <CheckCircle size={16} className="mt-0.5 shrink-0" />
          }
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
