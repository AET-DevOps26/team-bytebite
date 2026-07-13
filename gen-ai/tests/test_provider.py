from unittest.mock import patch

import pytest
from fastapi import HTTPException

from config import LOGOS_BASE_URL
from llm import get_client, normalize_provider


@pytest.mark.parametrize(
    "provider,expected",
    [
        ("openai", "openai"),
        ("logos", "logos"),
        (None, "logos"),
        ("anything-else", "logos"),
    ],
)
def test_normalize_provider(provider, expected):
    assert normalize_provider(provider) == expected


def test_openai_missing_key_raises_500(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(HTTPException) as exc_info:
        get_client("openai")
    assert exc_info.value.status_code == 500
    assert "OPENAI_API_KEY" in exc_info.value.detail


def test_logos_missing_key_raises_500(monkeypatch):
    monkeypatch.delenv("LOGOS_KEY", raising=False)
    with pytest.raises(HTTPException) as exc_info:
        get_client("logos")
    assert exc_info.value.status_code == 500
    assert "LOGOS_KEY" in exc_info.value.detail


def test_openai_constructs_client_with_key():
    with patch("llm.OpenAI") as mock_openai_cls:
        get_client("openai")
    _, kwargs = mock_openai_cls.call_args
    assert kwargs["api_key"] == "test-openai-key"
    assert "base_url" not in kwargs


def test_logos_constructs_client_with_base_url():
    with patch("llm.OpenAI") as mock_openai_cls:
        get_client("logos")
    _, kwargs = mock_openai_cls.call_args
    assert kwargs["api_key"] == "test-logos-key"
    assert kwargs["base_url"] == LOGOS_BASE_URL
