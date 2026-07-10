import json

from main import CANNED_INGREDIENTS, LOGOS_BASE_URL, LOGOS_MODEL, NO_LLM_NOTE, OPENAI_MODEL
from tests.conftest import _fake_response


def _set_llm_content(mock_openai_client, content):
    mock_openai_client.return_value.chat.completions.create.return_value = (
        _fake_response(content)
    )


def test_happy_path_returns_ingredients(client, mock_openai_client, sample_ingredient_json):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    response = client.post("/api/ai/parse", json={"dish": "Pancakes"})
    assert response.status_code == 200
    body = response.json()
    assert body["dish"] == "Pancakes"
    assert len(body["ingredients"]) == 2


def test_restricted_and_alternative_fields_roundtrip(
    client, mock_openai_client, sample_ingredient_json
):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    response = client.post("/api/ai/parse", json={"dish": "Pancakes"})
    milk = next(i for i in response.json()["ingredients"] if i["name"] == "milk")
    assert milk["restricted"] is True
    assert milk["alternative"] == "oat milk"


def test_malformed_llm_json_falls_back_to_canned_response(client, mock_openai_client):
    _set_llm_content(mock_openai_client, "not json at all")
    response = client.post("/api/ai/parse", json={"dish": "Pancakes"})
    assert response.status_code == 200
    body = response.json()
    assert body["note"] == NO_LLM_NOTE
    assert len(body["ingredients"]) == len(CANNED_INGREDIENTS)


def test_missing_ingredients_key_falls_back_to_canned_response(client, mock_openai_client):
    _set_llm_content(mock_openai_client, json.dumps({"foo": "bar"}))
    response = client.post("/api/ai/parse", json={"dish": "Pancakes"})
    assert response.status_code == 200
    body = response.json()
    assert body["note"] == NO_LLM_NOTE
    assert len(body["ingredients"]) == len(CANNED_INGREDIENTS)


def test_openai_error_falls_back_to_canned_response(client, mock_openai_client):
    from openai import OpenAIError

    mock_openai_client.return_value.chat.completions.create.side_effect = OpenAIError(
        "boom"
    )
    response = client.post(
        "/api/ai/parse", json={"dish": "Pancakes", "llm_provider": "openai"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["note"] == NO_LLM_NOTE
    assert len(body["ingredients"]) == len(CANNED_INGREDIENTS)


def test_missing_openai_key_falls_back_to_logos(
    client, mock_openai_client, sample_ingredient_json, monkeypatch
):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    response = client.post(
        "/api/ai/parse", json={"dish": "Pancakes", "llm_provider": "openai"}
    )
    assert response.status_code == 200
    _, kwargs = mock_openai_client.return_value.chat.completions.create.call_args
    assert kwargs["model"] == LOGOS_MODEL
    _, client_kwargs = mock_openai_client.call_args
    assert client_kwargs["base_url"] == LOGOS_BASE_URL


def test_default_provider_is_logos(client, mock_openai_client, sample_ingredient_json):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    client.post("/api/ai/parse", json={"dish": "Pancakes"})
    _, kwargs = mock_openai_client.return_value.chat.completions.create.call_args
    assert kwargs["model"] == LOGOS_MODEL
    assert "response_format" not in kwargs
    _, client_kwargs = mock_openai_client.call_args
    assert client_kwargs["base_url"] == LOGOS_BASE_URL


def test_openai_provider_selected(client, mock_openai_client, sample_ingredient_json):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    client.post(
        "/api/ai/parse", json={"dish": "Pancakes", "llm_provider": "openai"}
    )
    _, kwargs = mock_openai_client.return_value.chat.completions.create.call_args
    assert kwargs["model"] == OPENAI_MODEL
    assert kwargs["response_format"] == {"type": "json_object"}


def test_dietary_restrictions_passed_into_system_prompt(
    client, mock_openai_client, sample_ingredient_json
):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    client.post(
        "/api/ai/parse",
        json={"dish": "Pancakes", "dietary_restrictions": ["Vegan"]},
    )
    _, kwargs = mock_openai_client.return_value.chat.completions.create.call_args
    system_message = next(m for m in kwargs["messages"] if m["role"] == "system")
    assert "animal product" in system_message["content"]
