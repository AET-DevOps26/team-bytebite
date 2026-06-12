export type Ingredient = { name: string; quantity: string; unit: string; category: string; checked?: boolean; restricted?: boolean; alternative?: string | null }
export type GroceryList = { id: string; dish: string; createdAt: string; ingredients: Ingredient[] }
