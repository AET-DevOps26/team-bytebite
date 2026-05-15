import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import { Sidebar, LogoMark } from './components/Sidebar'
import { HeroSection } from './components/HeroSection'
import { RecipeCard } from './components/RecipeCard'
import { FeatureCards } from './components/FeatureCards'

function getInitialDark(): boolean {
  const stored = localStorage.getItem('bytebite-dark')
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function App() {
  const [darkMode, setDarkMode] = useState(getInitialDark)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('bytebite-dark', String(darkMode))
  }, [darkMode])

  const toggleDark = () => setDarkMode(d => !d)
  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8f4] dark:bg-[#0c1410] dot-grid">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={toggleDark}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSidebar}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:ml-64">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
          <button
            onClick={openSidebar}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={18} />
          </button>
          <LogoMark scale="sm" />
        </div>

        {/* Page content */}
        <div className="max-w-2xl mx-auto px-6 py-16">
          <HeroSection />
          <RecipeCard />
          <FeatureCards />
          <p className="mt-16 text-center text-xs text-gray-400 dark:text-gray-600">
            ByteBite · AI-powered grocery assistant
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
