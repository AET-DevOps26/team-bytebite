import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar, LogoMark } from './Sidebar'

interface AppLayoutProps {
  darkMode: boolean
  onToggleDark: () => void
}

// The chrome every authenticated page sits inside: sidebar, mobile top bar, and the page slot.
export function AppLayout({ darkMode, onToggleDark }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8f4] dark:bg-[#0c1410] dot-grid">
      <Sidebar
        darkMode={darkMode}
        onToggleDark={onToggleDark}
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
      <main className="flex-1 overflow-y-auto lg:ml-64 [scrollbar-gutter:stable]">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={18} />
          </button>
          <LogoMark scale="sm" />
        </div>

        {/* Page content. Deliberately NOT wrapped in an AnimatePresence keyed on the pathname: in
            wait mode that rebuilds the page subtree on every render, remounting the page and
            discarding its state (an open editor, a half-typed form), and it also stops the modal's
            own exit animation from completing. Each page already fades itself in on mount, so the
            only thing given up is a 150ms exit fade between routes. */}
        <div className="max-w-2xl mx-auto px-6 py-16">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
