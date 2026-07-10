import { describe, it, expect, vi, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ItemListForm } from './ItemListForm'
import type { EditableItem } from '../types'

function renderForm(overrides: Partial<React.ComponentProps<typeof ItemListForm>> = {}) {
  const onSubmit = (overrides.onSubmit ?? vi.fn().mockResolvedValue(true)) as Mock
  const onClose = overrides.onClose ?? vi.fn()
  render(
    <ItemListForm
      title="New recipe"
      submitLabel="Create recipe"
      nameLabel="Recipe name"
      namePlaceholder="e.g. Pasta"
      initialName=""
      initialItems={[]}
      onSubmit={onSubmit}
      onClose={onClose}
      {...overrides}
    />
  )
  return { onSubmit, onClose }
}

describe('ItemListForm', () => {
  it('submits the trimmed name and mapped items, then closes on success', async () => {
    const user = userEvent.setup()
    const { onSubmit, onClose } = renderForm()

    await user.type(screen.getByPlaceholderText('e.g. Pasta'), '  Pasta  ')
    await user.type(screen.getByPlaceholderText('Item name'), 'Spaghetti')
    await user.type(screen.getByPlaceholderText('Qty'), '500')
    await user.type(screen.getByPlaceholderText('Unit'), 'g')
    await user.selectOptions(screen.getByRole('combobox'), 'PANTRY')

    await user.click(screen.getByRole('button', { name: 'Create recipe' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const [name, items] = onSubmit.mock.calls[0] as [string, EditableItem[]]
    expect(name).toBe('Pasta')
    expect(items).toEqual([{ name: 'Spaghetti', quantity: '500', unit: 'g', category: 'PANTRY', purchased: undefined }])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('blocks submission with no name', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByPlaceholderText('Item name'), 'Spaghetti')
    await user.click(screen.getByRole('button', { name: 'Create recipe' }))

    expect(await screen.findByText('Please enter a name.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks submission when every row is empty', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByPlaceholderText('e.g. Pasta'), 'Pasta')
    await user.click(screen.getByRole('button', { name: 'Create recipe' }))

    expect(await screen.findByText('Add at least one item.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('adds and removes item rows (last row cannot be removed)', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.getAllByPlaceholderText('Item name')).toHaveLength(1)
    expect(screen.getByTitle('Remove item')).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /add item/i }))
    expect(screen.getAllByPlaceholderText('Item name')).toHaveLength(2)

    const removeButtons = screen.getAllByTitle('Remove item')
    expect(removeButtons[0]).toBeEnabled()
    await user.click(removeButtons[0])
    expect(screen.getAllByPlaceholderText('Item name')).toHaveLength(1)
  })

  it('drops rows whose name is blank before submitting', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByPlaceholderText('e.g. Pasta'), 'Pasta')
    await user.type(screen.getByPlaceholderText('Item name'), 'Spaghetti')
    await user.click(screen.getByRole('button', { name: /add item/i })) // second row left blank

    await user.click(screen.getByRole('button', { name: 'Create recipe' }))

    const [, items] = onSubmit.mock.calls[0] as [string, EditableItem[]]
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Spaghetti')
  })

  it('keeps itself open and shows an error when the submit handler fails', async () => {
    const user = userEvent.setup()
    const { onClose } = renderForm({ onSubmit: vi.fn().mockResolvedValue(false) })

    await user.type(screen.getByPlaceholderText('e.g. Pasta'), 'Pasta')
    await user.type(screen.getByPlaceholderText('Item name'), 'Spaghetti')
    await user.click(screen.getByRole('button', { name: 'Create recipe' }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})