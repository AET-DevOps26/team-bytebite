// Registers @testing-library/jest-dom's matchers (toBeInTheDocument, toBeDisabled, …) on
// Vitest's `expect` and augments the types, and clears the DOM between tests.
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom doesn't implement scrollTo; framer-motion calls it, so stub it to keep output clean.
window.scrollTo = vi.fn()

// jsdom doesn't implement matchMedia; App reads it on mount to pick the initial colour scheme.
window.matchMedia = window.matchMedia || ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as unknown as MediaQueryList))

afterEach(() => {
  cleanup()
})