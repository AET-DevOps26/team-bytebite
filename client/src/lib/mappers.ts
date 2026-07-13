// Pure conversions between the grocery-service API shapes and the client-side view models.
// These sit at the API boundary and hold the app's small but real quirks (null quantity ↔ 'N/A',
// derived purchased counts), so they're kept out of App.tsx and unit-tested directly.
import type {
  ApiRecipe, ApiRecipeSummary, RecipeSummary, Ingredient,
  ApiGroceryList, ApiGroceryListSummary, GroceryListSummary, GroceryItemDetail, EditableItem,
} from '../types'

export function apiSummaryToRecipe(summary: ApiRecipeSummary): RecipeSummary {
  return { id: summary.recipeId, dish: summary.name, createdAt: summary.createdAt }
}

// The API uses the DB's numeric quantity (null = unspecified); the client keeps a display
// string, so convert at the API boundary.
export function formatQuantity(quantity: number | null): string {
  return quantity === null ? 'N/A' : String(quantity)
}

export function parseQuantity(quantity: string): number | null {
  const trimmed = quantity?.trim()
  if (!trimmed || trimmed === 'N/A') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

// An ingredient that clashes with the user's diet is stored as its alternative — "milk" on a vegan
// recipe is saved as "oat milk". The swap happens here, at the one boundary every save funnels
// through, so what lands in the database is already the thing the user should buy and nothing
// downstream (the lists, the merge, the shop) has to know about diets at all.
//
// The flags only ever arrive on a freshly generated recipe; a row with no alternative (the model
// found none) or one typed by hand in the editor is saved exactly as written.
function resolveName(item: EditableItem): string {
  return item.restricted && item.alternative ? item.alternative : item.name
}

// Maps a form row to the API item payload. Recipes omit `purchased`; grocery lists send the
// row's current flag (undefined → false for newly added items) so surviving items stay picked up.
export function toRecipeItemPayload(item: EditableItem) {
  return {
    name: resolveName(item),
    quantity: parseQuantity(item.quantity),
    unit: item.unit,
    category: item.category,
  }
}

export function toGroceryItemPayload(item: EditableItem) {
  return { ...toRecipeItemPayload(item), purchased: item.purchased ?? false }
}

export function apiItemsToIngredients(recipe: ApiRecipe): Ingredient[] {
  return recipe.items.map(item => ({
    name: item.name,
    quantity: formatQuantity(item.quantity),
    unit: item.unit,
    category: item.category,
  }))
}

export function apiSummaryToGroceryList(summary: ApiGroceryListSummary): GroceryListSummary {
  return {
    id: summary.groceryListId,
    dish: summary.name,
    createdAt: summary.createdAt,
    itemCount: summary.itemCount,
    purchasedCount: summary.purchasedCount,
  }
}

// POST/PUT return the full detail; derive the summary counts the list view needs from it.
export function detailToGrocerySummary(detail: ApiGroceryList): GroceryListSummary {
  return {
    id: detail.groceryListId,
    dish: detail.name,
    createdAt: detail.createdAt,
    itemCount: detail.items.length,
    purchasedCount: detail.items.filter(item => item.purchased).length,
  }
}

export function apiItemsToGroceryDetail(list: ApiGroceryList): GroceryItemDetail[] {
  return list.items.map(item => ({
    itemId: item.itemId,
    name: item.name,
    quantity: formatQuantity(item.quantity),
    unit: item.unit,
    category: item.category,
    purchased: item.purchased,
  }))
}