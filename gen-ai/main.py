import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from openai import OpenAI, OpenAIError
from pydantic import BaseModel

load_dotenv()

app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
## Role
You are a specialized Grocery List Agent. Your sole task is to convert recipe text into a structured, metric-only JSON grocery list.

## Task
0. If the input contains narrative prose, stories, or blog content surrounding a recipe,
   ignore everything that is not part of the recipe itself. Extract only the ingredients.
1. Parse the provided recipe or dish name for ingredients.
2. Convert ALL non-metric units to the metric system (grams or milliliters).
3. If an ingredient is a "count" (e.g., "2 onions"), use "piece" or "unit" as the unit.
4. If a quantity/unit is missing or vague ("salt to taste"), use "N/A" for those fields.

## Conversion Rules
- 1 cup ≈ 240 ml (liquids) or the appropriate weight in grams (dry).
- 1 tablespoon (tbsp) = 15 ml
- 1 teaspoon (tsp) = 5 ml
- 1 ounce (oz) ≈ 28 g
- 1 pound (lb) ≈ 450 g
- Use decimal points instead of fractions (e.g., 0.5 instead of 1/2).

## Categorization
Assign each ingredient a grocery store aisle category. Use one of the following:
- Produce
- Dairy & Eggs
- Meat & Seafood
- Bakery & Bread
- Baking Needs
- Canned & Jarred Goods
- Dry Goods & Pasta
- Condiments & Sauces
- Spices & Herbs
- Frozen Foods
- Beverages
- Snacks
- International Foods
- Other

## Constraints
- Return ONLY valid JSON.
- Do not use markdown code blocks (```json).
- Format: {"ingredients": [{"name": "string", "quantity": "string", "unit": "string", "category": "string"}]}

## Input Data
[User Input Follows]

"""


class Ingredient(BaseModel):
    name: str
    quantity: str
    unit: str
    category: str


class GenerateRequest(BaseModel):
    dish: str


class GenerateResponse(BaseModel):
    dish: str
    ingredients: list[Ingredient]


class MergeRequest(BaseModel):
    recipes: list[list[Ingredient]]


class MergeResponse(BaseModel):
    ingredients: list[Ingredient]


MERGE_PROMPT = """
## Role
You are a Grocery List Merging Agent. Your sole task is to combine multiple ingredient lists into one unified, deduplicated shopping list.

## Task
1. Merge all provided ingredient lists into a single list.
2. Combine duplicate ingredients: if the same ingredient appears in multiple lists, sum their quantities.
3. Apply semantic deduplication: treat ingredients that refer to the same thing as duplicates
   (e.g. "garlic clove" and "garlic", "cherry tomatoes" and "tomatoes" should NOT be merged — use judgment).
4. If units differ for the same ingredient, convert to a common metric unit before summing.
5. If a quantity is "N/A" and the other is numeric, keep the numeric value.
6. If both quantities are "N/A", keep "N/A".
7. Preserve the category from the first occurrence of each ingredient.

## Constraints
- Return ONLY valid JSON.
- Do not use markdown code blocks (```json).
- Format: {"ingredients": [{"name": "string", "quantity": "string", "unit": "string", "category": "string"}]}

## Input Data
[Ingredient lists follow as JSON]

"""


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/ai/parse", response_model=GenerateResponse)
def generate(request: GenerateRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.dish},
            ],
        )
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    try:
        data = json.loads(response.choices[0].message.content)
        ingredients = [Ingredient(**item) for item in data["ingredients"]]
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}")

    return GenerateResponse(dish=request.dish, ingredients=ingredients)


@app.post("/api/ai/merge", response_model=MergeResponse)
def merge(request: MergeRequest):
    recipes_json = json.dumps(
        [[ing.model_dump() for ing in recipe] for recipe in request.recipes],
        indent=2,
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": MERGE_PROMPT},
                {"role": "user", "content": recipes_json},
            ],
        )
    except OpenAIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {e}")

    try:
        data = json.loads(response.choices[0].message.content)
        ingredients = [Ingredient(**item) for item in data["ingredients"]]
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {e}")

    return MergeResponse(ingredients=ingredients)
