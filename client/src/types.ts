export type Ingredient = { name: string; quantity: string; unit: string; category: string; checked?: boolean }
export type GroceryList = { id: string; dish: string; createdAt: string; ingredients: Ingredient[] }
