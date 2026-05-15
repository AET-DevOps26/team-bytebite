import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ShoppingCart, Heart,
  Settings, User, Sun, Moon, X,
  Leaf,
} from 'lucide-react'

interface SidebarProps {
  darkMode: boolean
  onToggleDark: () => void
  isOpen: boolean
  onClose: () => void
}

const navMain = [
  { icon: Home, label: 'Home', active: true },
  { icon: ShoppingCart, label: 'Shopping Lists' },
  { icon: Heart, label: 'Favorites' },
]

const navAccount = [
  { icon: Settings, label: 'Settings' },
  { icon: User, label: 'Profile' },
]

export function LogoMark({ scale = 'lg' }: { scale?: 'sm' | 'lg' }) {
  const boxCls = scale === 'lg'
    ? 'w-8 h-8 rounded-xl'
    : 'w-6 h-6 rounded-lg'
  const iconSize = scale === 'lg' ? 16 : 13
  const textCls = scale === 'lg'
    ? 'text-[1.2rem] leading-none font-black tracking-tight'
    : 'text-[1rem] leading-none font-black tracking-tight'

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`${boxCls} bg-[#2d6a4f] flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Leaf size={iconSize} className="text-white" />
      </div>
      <span className={`${textCls} text-gray-900 dark:text-white`}>ByteBite</span>
    </div>
  )
}

function NavSection({ label, items }: { label: string; items: typeof navMain }) {
  return (
    <div className="mb-1">
      <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500">
        {label}
      </p>
      {items.map(({ icon: Icon, label: itemLabel, active }) => (
        <motion.button
          key={itemLabel}
          whileHover={{ x: 2 }}
          transition={{ duration: 0.15 }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
            active
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Icon size={16} className={active ? 'text-[#2d6a4f] dark:text-green-400' : ''} />
          {itemLabel}
        </motion.button>
      ))}
    </div>
  )
}

function SidebarContent({ darkMode, onToggleDark }: { darkMode: boolean; onToggleDark: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200/60 dark:border-gray-800/60">
        <LogoMark scale="lg" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        <NavSection label="Main" items={navMain} />
        <NavSection label="Account" items={navAccount} />
      </nav>

      {/* Dark mode toggle */}
      <div className="px-4 py-4 border-t border-gray-200/60 dark:border-gray-800/60">
        <button
          onClick={onToggleDark}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
        >
          <span className="font-medium">{darkMode ? 'Light mode' : 'Dark mode'}</span>
          <div className="relative w-10 h-5 rounded-full bg-gray-200 dark:bg-[#2d6a4f] transition-colors duration-300">
            <motion.div
              animate={{ x: darkMode ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center"
            >
              {darkMode
                ? <Moon size={9} className="text-[#2d6a4f]" />
                : <Sun size={9} className="text-yellow-500" />
              }
            </motion.div>
          </div>
        </button>
      </div>
    </div>
  )
}

export function Sidebar({ darkMode, onToggleDark, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 z-20">
        <SidebarContent darkMode={darkMode} onToggleDark={onToggleDark} />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="lg:hidden fixed left-0 top-0 h-full w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800/50 z-50 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={16} />
            </button>
            <SidebarContent darkMode={darkMode} onToggleDark={onToggleDark} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
