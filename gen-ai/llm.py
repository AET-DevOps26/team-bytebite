import json
import os
import re

from fastapi import HTTPException
from openai import OpenAI, OpenAIError

from config import (
    DEFAULT_LLM_PROVIDER,
    LM_STUDIO_BASE_URL,
    LM_STUDIO_MODEL,
    LOGOS_BASE_URL,
    LOGOS_MODEL,
    OPENAI_MODEL,
    Provider,
)
from schemas import Ingredient

# Re-exported so callers can `except OpenAIError` without importing openai directly.
__all__ = [
    "OpenAI",
    "OpenAIError",
    "NO_LLM_NOTE",
    "CANNED_INGREDIENTS",
    "get_client",
    "openai_available",
    "normalize_provider",
    "create_chat_completion",
    "parse_json_content",
]

NO_LLM_NOTE = "No LLM is currently available — showing a canned example response."

# Shown when no LLM provider is configured/reachable, so the UI always has something to display.
CANNED_INGREDIENTS = [
    Ingredient(name="Spaghetti", quantity="400", unit="g", category="Pantry"),
    Ingredient(name="Garlic", quantity="2", unit="piece", category="Produce"),
    Ingredient(name="Olive oil", quantity="30", unit="ml", category="Pantry"),
    Ingredient(name="Parmesan cheese", quantity="50", unit="g", category="Dairy"),
    Ingredient(name="Salt", quantity="N/A", unit="N/A", category="Spices"),
]


def get_client(provider: Provider) -> OpenAI:
    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")
        return OpenAI(api_key=api_key)

    if provider == "local":
        # LM Studio's OpenAI-compatible server doesn't validate the key, but the
        # client requires a non-empty string.
        return OpenAI(api_key="lm-studio", base_url=LM_STUDIO_BASE_URL)

    api_key = os.getenv("LOGOS_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="LOGOS_KEY is not configured")
    return OpenAI(api_key=api_key, base_url=LOGOS_BASE_URL)


def openai_available() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def normalize_provider(provider: str | None) -> Provider:
    if provider == "local":
        return "local"
    # OpenAI is opt-in and requires OPENAI_API_KEY; without it we always fall back to
    # Logos, which is the hard dependency for this service.
    if provider == "openai" and openai_available():
        return "openai"
    return DEFAULT_LLM_PROVIDER


def create_chat_completion(provider: Provider, messages: list[dict[str, str]]):
    if provider == "openai":
        model = OPENAI_MODEL
    elif provider == "local":
        model = LM_STUDIO_MODEL
    else:
        model = LOGOS_MODEL

    kwargs = {
        "model": model,
        "messages": messages,
        # Low temperature keeps categorization deterministic so the same ingredient
        # is not labelled differently across requests.
        "temperature": 0,
    }
    if provider == "openai":
        kwargs["response_format"] = {"type": "json_object"}
    return get_client(provider).chat.completions.create(**kwargs)


def parse_json_content(content: str | None) -> dict:
    if not content:
        raise ValueError("LLM response was empty")

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if not match:
            raise ValueError(f"LLM response was not valid JSON: {e}") from None
        return json.loads(match.group(0))
