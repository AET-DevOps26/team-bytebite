export type Ingredient = { name: string; quantity: string; unit: string; category: string; checked?: boolean; restricted?: boolean; alternative?: string | null }
export type GroceryList = { id: string; dish: string; createdAt: string; ingredients: Ingredient[] }

// Detail shape returned by grocery-service POST /api/recipes and GET /api/recipes/{id}
export type ApiRecipe = {
  recipeId: string
  name: string
  createdAt: string
  items: { itemId: string; name: string; quantity: number | null; unit: string; category: string }[]
}

// Summary shape returned by GET /api/recipes (no items — fetched lazily per recipe)
export type ApiRecipeSummary = { recipeId: string; name: string; createdAt: string }

// Client-side recipe summary used by the Recipes list
export type RecipeSummary = { id: string; dish: string; createdAt: string }

// Detail shape returned by grocery-service POST /api/grocery-list and GET /api/grocery-list/{id}
export type ApiGroceryList = {
  groceryListId: string
  name: string
  createdAt: string
  items: { itemId: string; name: string; quantity: number | null; unit: string; category: string; purchased: boolean }[]
}

// Summary shape returned by GET /api/grocery-list — item counts instead of items, so the
// collapsed cards can show progress without fetching every item.
export type ApiGroceryListSummary = {
  groceryListId: string
  name: string
  createdAt: string
  itemCount: number
  purchasedCount: number
}

// Client-side grocery-list summary used by the Grocery Lists view
export type GroceryListSummary = { id: string; dish: string; createdAt: string; itemCount: number; purchasedCount: number }

// A grocery item with its server id + purchased state, for the lazily-loaded detail view
export type GroceryItemDetail = { itemId: string; name: string; quantity: string; unit: string; category: string; purchased: boolean }
