import { describe, it, expect } from 'vitest'
import {
  apiSummaryToRecipe, formatQuantity, parseQuantity, toRecipeItemPayload, toGroceryItemPayload,
  apiItemsToIngredients, apiSummaryToGroceryList, detailToGrocerySummary, apiItemsToGroceryDetail,
} from './mappers'
import type { ApiRecipe, ApiGroceryList, EditableItem } from '../types'

describe('formatQuantity', () => {
  it('renders null as the "N/A" sentinel', () => {
    expect(formatQuantity(null)).toBe('N/A')
  })

  it('stringifies numeric quantities, including zero', () => {
    expect(formatQuantity(0)).toBe('0')
    expect(formatQuantity(2.5)).toBe('2.5')
  })
})

describe('parseQuantity', () => {
  it('treats empty, whitespace and "N/A" as unspecified (null)', () => {
    expect(parseQuantity('')).toBeNull()
    expect(parseQuantity('   ')).toBeNull()
    expect(parseQuantity('N/A')).toBeNull()
  })

  it('parses numeric strings, trimming surrounding whitespace', () => {
    expect(parseQuantity('3')).toBe(3)
    expect(parseQuantity('  2.5 ')).toBe(2.5)
    expect(parseQuantity('0')).toBe(0)
  })

  it('returns null for non-numeric text rather than NaN', () => {
    expect(parseQuantity('a lot')).toBeNull()
  })

  it('round-trips with formatQuantity for real quantities', () => {
    expect(parseQuantity(formatQuantity(4))).toBe(4)
    expect(parseQuantity(formatQuantity(null))).toBeNull()
  })
})

describe('apiSummaryToRecipe', () => {
  it('renames the API fields to the client view model', () => {
    expect(apiSummaryToRecipe({ recipeId: 'r1', name: 'Pasta', createdAt: '2026-01-01' })).toEqual({
      id: 'r1',
      dish: 'Pasta',
      createdAt: '2026-01-01',
    })
  })
})

describe('toRecipeItemPayload / toGroceryItemPayload', () => {
  const row: EditableItem = { name: 'Milk', quantity: '2', unit: 'L', category: 'DAIRY' }

  it('parses the display quantity and omits purchased for recipe payloads', () => {
    const payload = toRecipeItemPayload(row)
    expect(payload).toEqual({ name: 'Milk', quantity: 2, unit: 'L', category: 'DAIRY' })
    expect(payload).not.toHaveProperty('purchased')
  })

  it('carries the purchased flag through for grocery payloads', () => {
    expect(toGroceryItemPayload({ ...row, purchased: true })).toEqual({
      name: 'Milk', quantity: 2, unit: 'L', category: 'DAIRY', purchased: true,
    })
  })

  it('defaults an unset purchased flag to false (newly added rows)', () => {
    expect(toGroceryItemPayload(row).purchased).toBe(false)
  })

  it('passes an unspecified quantity through as null', () => {
    expect(toRecipeItemPayload({ ...row, quantity: '' }).quantity).toBeNull()
  })
})

describe('apiItemsToIngredients', () => {
  it('maps items and formats each quantity', () => {
    const recipe: ApiRecipe = {
      recipeId: 'r1',
      name: 'Pasta',
      createdAt: '2026-01-01',
      items: [
        { itemId: 'i1', name: 'Spaghetti', quantity: 500, unit: 'g', category: 'PANTRY' },
        { itemId: 'i2', name: 'Salt', quantity: null, unit: '', category: 'SPICES' },
      ],
    }
    expect(apiItemsToIngredients(recipe)).toEqual([
      { name: 'Spaghetti', quantity: '500', unit: 'g', category: 'PANTRY' },
      { name: 'Salt', quantity: 'N/A', unit: '', category: 'SPICES' },
    ])
  })
})

describe('apiSummaryToGroceryList', () => {
  it('maps ids and preserves the summary counts', () => {
    expect(apiSummaryToGroceryList({
      groceryListId: 'g1', name: 'Weekend', createdAt: '2026-01-02', itemCount: 5, purchasedCount: 2,
    })).toEqual({
      id: 'g1', dish: 'Weekend', createdAt: '2026-01-02', itemCount: 5, purchasedCount: 2,
    })
  })
})

describe('detailToGrocerySummary', () => {
  const detail: ApiGroceryList = {
    groceryListId: 'g1',
    name: 'Weekend',
    createdAt: '2026-01-02',
    items: [
      { itemId: 'i1', name: 'Milk', quantity: 2, unit: 'L', category: 'DAIRY', purchased: true },
      { itemId: 'i2', name: 'Eggs', quantity: 12, unit: '', category: 'DAIRY', purchased: false },
      { itemId: 'i3', name: 'Bread', quantity: 1, unit: '', category: 'BAKERY', purchased: true },
    ],
  }

  it('derives itemCount and purchasedCount from the items array', () => {
    expect(detailToGrocerySummary(detail)).toEqual({
      id: 'g1', dish: 'Weekend', createdAt: '2026-01-02', itemCount: 3, purchasedCount: 2,
    })
  })

  it('reports zero counts for an empty list', () => {
    expect(detailToGrocerySummary({ ...detail, items: [] })).toMatchObject({ itemCount: 0, purchasedCount: 0 })
  })
})

describe('apiItemsToGroceryDetail', () => {
  it('keeps item ids and purchased state while formatting quantities', () => {
    const list: ApiGroceryList = {
      groceryListId: 'g1',
      name: 'Weekend',
      createdAt: '2026-01-02',
      items: [
        { itemId: 'i1', name: 'Milk', quantity: 2, unit: 'L', category: 'DAIRY', purchased: true },
        { itemId: 'i2', name: 'Salt', quantity: null, unit: '', category: 'SPICES', purchased: false },
      ],
    }
    expect(apiItemsToGroceryDetail(list)).toEqual([
      { itemId: 'i1', name: 'Milk', quantity: '2', unit: 'L', category: 'DAIRY', purchased: true },
      { itemId: 'i2', name: 'Salt', quantity: 'N/A', unit: '', category: 'SPICES', purchased: false },
    ])
  })
})