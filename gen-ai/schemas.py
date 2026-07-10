from pydantic import BaseModel

from config import DEFAULT_LLM_PROVIDER


class Ingredient(BaseModel):
    name: str
    quantity: str
    unit: str
    category: str
    restricted: bool = False
    alternative: str | None = None


class GenerateRequest(BaseModel):
    dish: str
    dietary_restrictions: list[str] = []
    llm_provider: str = DEFAULT_LLM_PROVIDER


class GenerateResponse(BaseModel):
    dish: str
    ingredients: list[Ingredient]
    note: str | None = None


class MergeRequest(BaseModel):
    recipes: list[list[Ingredient]]
    llm_provider: str = DEFAULT_LLM_PROVIDER


class MergeResponse(BaseModel):
    ingredients: list[Ingredient]
    note: str | None = None
