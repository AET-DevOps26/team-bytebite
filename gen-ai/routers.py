import json

from fastapi import APIRouter, HTTPException

from llm import (
    CANNED_INGREDIENTS,
    NO_LLM_NOTE,
    OpenAIError,
    create_chat_completion,
    normalize_provider,
    openai_available,
    parse_json_content,
)
from prompts import MERGE_PROMPT, build_system_prompt
from schemas import (
    GenerateRequest,
    GenerateResponse,
    Ingredient,
    MergeRequest,
    MergeResponse,
)

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "openai_available": openai_available()}


@router.post("/api/ai/parse", response_model=GenerateResponse)
def generate(request: GenerateRequest):
    provider = normalize_provider(request.llm_provider)
    system_prompt = build_system_prompt(request.dietary_restrictions)
    try:
        response = create_chat_completion(
            provider,
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.dish},
            ],
        )
        data = parse_json_content(response.choices[0].message.content)
        ingredients = [Ingredient(**item) for item in data["ingredients"]]
    except (HTTPException, OpenAIError, KeyError, ValueError):
        return GenerateResponse(dish=request.dish, ingredients=CANNED_INGREDIENTS, note=NO_LLM_NOTE)

    return GenerateResponse(dish=request.dish, ingredients=ingredients)


@router.post("/api/ai/merge", response_model=MergeResponse)
def merge(request: MergeRequest):
    provider = normalize_provider(request.llm_provider)
    recipes_json = json.dumps(
        [[ing.model_dump() for ing in recipe] for recipe in request.recipes],
        indent=2,
    )

    try:
        response = create_chat_completion(
            provider,
            [
                {"role": "system", "content": MERGE_PROMPT},
                {"role": "user", "content": recipes_json},
            ],
        )
        data = parse_json_content(response.choices[0].message.content)
        ingredients = [Ingredient(**item) for item in data["ingredients"]]
    except (HTTPException, OpenAIError, KeyError, ValueError):
        # Fall back to the first recipe as-is so the merge UI still has something to show.
        fallback = [ing for recipe in request.recipes for ing in recipe][:5] or CANNED_INGREDIENTS
        return MergeResponse(ingredients=fallback, note=NO_LLM_NOTE)

    return MergeResponse(ingredients=ingredients)
