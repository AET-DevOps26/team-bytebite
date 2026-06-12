export type Ingredient = { name: string; quantity: string; unit: string; category: string; checked?: boolean; restricted?: boolean; alternative?: string | null }
export type GroceryList = { id: string; dish: string; createdAt: string; ingredients: Ingredient[] }

// Shape returned by grocery-service GET/POST /api/recipes
export type ApiRecipe = {
  recipeId: string
  name: string
  createdAt: string
  items: { itemId: string; name: string; quantity: string; unit: string; category: string }[]
}
