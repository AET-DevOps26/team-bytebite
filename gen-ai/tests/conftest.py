import json
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture(autouse=True)
def stub_env(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setenv("LOGOS_KEY", "test-logos-key")


@pytest.fixture
def client():
    return TestClient(main.app)


def _fake_response(content: str):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )


@pytest.fixture
def mock_openai_client():
    with patch("llm.OpenAI") as mock_openai_cls:
        mock_instance = mock_openai_cls.return_value
        mock_instance.chat.completions.create = MagicMock(
            return_value=_fake_response(json.dumps({"ingredients": []}))
        )
        yield mock_openai_cls


@pytest.fixture
def sample_ingredient_json():
    return json.dumps(
        {
            "ingredients": [
                {
                    "name": "flour",
                    "quantity": "200",
                    "unit": "g",
                    "category": "Pantry",
                    "restricted": False,
                    "alternative": None,
                },
                {
                    "name": "milk",
                    "quantity": "240",
                    "unit": "ml",
                    "category": "Dairy",
                    "restricted": True,
                    "alternative": "oat milk",
                },
            ]
        }
    )
