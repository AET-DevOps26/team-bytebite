import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Loader2, UserPlus, Utensils } from 'lucide-react'
import { AlertBanner } from './AlertBanner'

export type AuthUser = {
  userId: string
  name: string
  email: string
  createdAt: string
}

export type AuthPayload = {
  token: string
  user: AuthUser
}

type Mode = 'login' | 'register'

interface AuthCardProps {
  onAuthenticated: (payload: AuthPayload) => void
}

export function AuthCard({ onAuthenticated }: AuthCardProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode)
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(isRegister ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.')
      }

      onAuthenticated(data as AuthPayload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 bg-[#f7f8f4] dark:bg-[#0c1410] dot-grid">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/85 dark:bg-gray-900/85 backdrop-blur-2xl border border-gray-200/60 dark:border-gray-800/60 rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/30 p-8"
      >
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-2xl bg-[#2d6a4f] flex items-center justify-center shadow-sm">
            <Utensils size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ByteBite</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to continue</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-6">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === 'register'
                ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <label className="block">
              <span className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                autoComplete="name"
                required
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-950/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2d6a4f]/70 focus:ring-2 focus:ring-[#2d6a4f]/15"
              />
            </label>
          )}

          <label className="block">
            <span className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-950/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2d6a4f]/70 focus:ring-2 focus:ring-[#2d6a4f]/15"
            />
          </label>

          <label className="block">
            <span className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={8}
              required
              className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-950/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-[#2d6a4f]/70 focus:ring-2 focus:ring-[#2d6a4f]/15"
            />
          </label>

          <AlertBanner type="error" message={error} visible={!!error} />

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { y: -2 } : {}}
            whileTap={!loading ? { scale: 0.98, y: 0 } : {}}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#1b5e38] to-[#2d6a4f] text-white font-semibold text-sm shadow-lg shadow-green-900/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Please wait
              </>
            ) : isRegister ? (
              <>
                <UserPlus size={16} />
                Create account
              </>
            ) : (
              <>
                <LogIn size={16} />
                Login
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
