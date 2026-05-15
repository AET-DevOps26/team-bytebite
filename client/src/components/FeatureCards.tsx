import { motion } from 'framer-motion'
import { Brain, LayoutList, Leaf, type LucideIcon } from 'lucide-react'

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Brain,
    title: 'Smart parsing',
    desc: 'We understand ingredients, quantities, and units automatically.',
  },
  {
    icon: LayoutList,
    title: 'Organized lists',
    desc: 'Grouped by store sections for faster, stress-free shopping.',
  },
  {
    icon: Leaf,
    title: 'Reduce waste',
    desc: 'Buy only what you need — nothing more, nothing less.',
  },
]

export function FeatureCards() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10"
    >
      {features.map(({ icon: Icon, title, desc }) => (
        <motion.div
          key={title}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/30 rounded-2xl p-6 shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Icon size={20} className="text-[#2d6a4f] dark:text-green-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
