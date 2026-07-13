import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'bytebite-dark'

// An explicit choice wins; otherwise follow the OS.
function getInitialDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(getInitialDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(STORAGE_KEY, String(darkMode))
  }, [darkMode])

  const toggleDark = useCallback(() => setDarkMode(current => !current), [])

  return { darkMode, toggleDark }
}
