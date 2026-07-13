import { describe, it, expect, vi, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroceryListsPage } from './GroceryListsPage'
import type { GroceryListSummary, GroceryItemDetail } from '../types'

const list: GroceryListSummary = {
  id: 'g1', dish: 'Weekend', createdAt: '2026-01-02', itemCount: 2, purchasedCount: 0,
}

const items: GroceryItemDetail[] = [
  { itemId: 'i1', name: 'Milk', quantity: '2', unit: 'L', category: 'DAIRY', purchased: false },
  { itemId: 'i2', name: 'Eggs', quantity: 'N/A', unit: '', category: 'DAIRY', purchased: false },
]

function renderView(overrides: Partial<React.ComponentProps<typeof GroceryListsPage>> = {}) {
  const props = {
    lists: [list],
    status: 'ready' as const,
    onRetry: vi.fn(),
    onToggleItem: vi.fn().mockResolvedValue(true),
    onDeleteList: vi.fn(),
    onCreateList: vi.fn().mockResolvedValue(true),
    onUpdateList: vi.fn().mockResolvedValue(null),
    fetchItems: vi.fn().mockResolvedValue(items),
    ...overrides,
  }
  render(<GroceryListsPage {...props} />)
  return props
}

describe('GroceryListsPage load states', () => {
  it('shows a spinner while loading', () => {
    renderView({ status: 'loading' })
    expect(screen.getByText(/loading your grocery lists/i)).toBeInTheDocument()
  })

  it('shows an error with a retry that calls onRetry', async () => {
    const user = userEvent.setup()
    const { onRetry } = renderView({ status: 'error' })
    expect(screen.getByText(/couldn't load grocery lists/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state when there are no lists', () => {
    renderView({ lists: [] })
    expect(screen.getByText(/no grocery lists yet/i)).toBeInTheDocument()
  })

  it('renders the list card when ready', () => {
    renderView()
    expect(screen.getByText('Weekend')).toBeInTheDocument()
  })
})

describe('GroceryListsPage item loading', () => {
  it('lazily fetches items when a card is expanded', async () => {
    const user = userEvent.setup()
    const { fetchItems } = renderView()

    await user.click(screen.getByTitle('Expand'))

    await waitFor(() => expect(fetchItems).toHaveBeenCalledWith('g1'))
    expect(await screen.findByRole('button', { name: /Milk/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Eggs/ })).toBeInTheDocument()
  })

  it('shows a retryable error when item loading fails', async () => {
    const user = userEvent.setup()
    const fetchItems = vi.fn().mockRejectedValue(new Error('boom'))
    renderView({ fetchItems })

    await user.click(screen.getByTitle('Expand'))

    expect(await screen.findByText(/couldn't load items/i)).toBeInTheDocument()
    // A second attempt is wired up behind the Retry button.
    await user.click(screen.getByRole('button', { name: /retry/i }))
    await waitFor(() => expect(fetchItems).toHaveBeenCalledTimes(2))
  })
})

describe('GroceryListsPage optimistic toggle', () => {
  it('marks an item purchased immediately and persists it', async () => {
    const user = userEvent.setup()
    const { onToggleItem } = renderView()

    await user.click(screen.getByTitle('Expand'))
    const milk = await screen.findByRole('button', { name: /Milk/ })
    expect(milk).not.toHaveClass('text-white')

    await user.click(milk)

    expect(onToggleItem).toHaveBeenCalledWith('g1', 'i1', true)
    // Optimistic update flips the pill to its "checked" styling right away.
    await waitFor(() => expect(screen.getByRole('button', { name: /Milk/ })).toHaveClass('text-white'))
  })

  it('reverts the optimistic update when the server rejects it', async () => {
    const user = userEvent.setup()
    const onToggleItem = vi.fn().mockResolvedValue(false)
    renderView({ onToggleItem })

    await user.click(screen.getByTitle('Expand'))
    const milk = await screen.findByRole('button', { name: /Milk/ })
    await user.click(milk)

    expect(onToggleItem).toHaveBeenCalledWith('g1', 'i1', true)
    // After the rejection the pill rolls back to its unchecked styling.
    await waitFor(() => expect(screen.getByRole('button', { name: /Milk/ })).not.toHaveClass('text-white'))
  })
})

describe('GroceryListsPage actions', () => {
  it('deletes a list via the delete control', async () => {
    const user = userEvent.setup()
    const { onDeleteList } = renderView()
    await user.click(screen.getByTitle('Delete list'))
    expect(onDeleteList).toHaveBeenCalledWith('g1')
  })

  it('opens the create form and creates a list', async () => {
    const user = userEvent.setup()
    const { onCreateList } = renderView()

    await user.click(screen.getByRole('button', { name: /new list/i }))
    await user.type(screen.getByPlaceholderText('e.g. Weekend shop'), 'Monday shop')
    await user.type(screen.getByPlaceholderText('Item name'), 'Bananas')
    await user.click(screen.getByRole('button', { name: /create list/i }))

    await waitFor(() => expect(onCreateList).toHaveBeenCalledTimes(1))
    expect((onCreateList as Mock).mock.calls[0][0]).toBe('Monday shop')
  })
})