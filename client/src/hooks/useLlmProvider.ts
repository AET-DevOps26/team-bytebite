import { useEffect, useState } from 'react'
import type { LlmProvider } from '../types'

const STORAGE_KEY = 'bytebite:llmProvider'

// Shared by the Home page (which generates) and the Recipes page (which merges), so it is held once
// at the top of the app rather than in either page.
export function useLlmProvider() {
  const [llmProvider, setLlmProvider] = useState<LlmProvider>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'openai' || stored === 'local' ? stored : 'logos'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, llmProvider)
  }, [llmProvider])

  return { llmProvider, setLlmProvider }
}
