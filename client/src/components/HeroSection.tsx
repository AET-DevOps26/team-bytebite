import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative text-center mb-10"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[480px] h-[240px] rounded-full bg-[#2d6a4f]/8 dark:bg-[#2d6a4f]/10 blur-3xl" />
      </div>

      <h1 className="text-5xl font-bold tracking-tight leading-tight text-gray-900 dark:text-white">
        Turn any recipe into a{' '}
        <span className="bg-gradient-to-r from-[#1b5e38] to-[#40916c] bg-clip-text text-transparent">
          smart
        </span>{' '}
        shopping list.
      </h1>

      <p className="mt-5 text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
        Paste a recipe or meal idea and ByteBite instantly organizes ingredients
        for your next grocery run.
      </p>
    </motion.div>
  )
}
