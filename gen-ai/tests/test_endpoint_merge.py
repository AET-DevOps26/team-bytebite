import json

from main import LOGOS_BASE_URL, LOGOS_MODEL

from tests.conftest import _fake_response


def _set_llm_content(mock_openai_client, content):
    mock_openai_client.return_value.chat.completions.create.return_value = (
        _fake_response(content)
    )


def _ingredient(name="flour", quantity="100", unit="g", category="Pantry"):
    return {
        "name": name,
        "quantity": quantity,
        "unit": unit,
        "category": category,
        "restricted": False,
        "alternative": None,
    }


def test_happy_path_merges_and_returns_ingredients(
    client, mock_openai_client, sample_ingredient_json
):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    response = client.post(
        "/api/ai/merge",
        json={"recipes": [[_ingredient()], [_ingredient(name="sugar")]]},
    )
    assert response.status_code == 200
    assert len(response.json()["ingredients"]) == 2


def test_malformed_llm_json_returns_500(client, mock_openai_client):
    _set_llm_content(mock_openai_client, "not json")
    response = client.post("/api/ai/merge", json={"recipes": [[_ingredient()]]})
    assert response.status_code == 500


def test_openai_error_returns_502(client, mock_openai_client):
    from openai import OpenAIError

    mock_openai_client.return_value.chat.completions.create.side_effect = OpenAIError(
        "boom"
    )
    response = client.post(
        "/api/ai/merge",
        json={"recipes": [[_ingredient()]], "llm_provider": "openai"},
    )
    assert response.status_code == 502


def test_missing_openai_key_falls_back_to_logos(
    client, mock_openai_client, sample_ingredient_json, monkeypatch
):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    response = client.post(
        "/api/ai/merge",
        json={"recipes": [[_ingredient()]], "llm_provider": "openai"},
    )
    assert response.status_code == 200
    _, kwargs = mock_openai_client.return_value.chat.completions.create.call_args
    assert kwargs["model"] == LOGOS_MODEL
    _, client_kwargs = mock_openai_client.call_args
    assert client_kwargs["base_url"] == LOGOS_BASE_URL


def test_empty_recipes_list_still_calls_llm(
    client, mock_openai_client, sample_ingredient_json
):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    response = client.post("/api/ai/merge", json={"recipes": []})
    assert response.status_code == 200
    mock_openai_client.return_value.chat.completions.create.assert_called_once()
