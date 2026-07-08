import json

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


def test_recipes_serialized_into_user_message(
    client, mock_openai_client, sample_ingredient_json
):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    recipes = [[_ingredient()], [_ingredient(name="sugar")]]
    client.post("/api/ai/merge", json={"recipes": recipes})
    _, kwargs = mock_openai_client.return_value.chat.completions.create.call_args
    user_message = next(m for m in kwargs["messages"] if m["role"] == "user")
    sent = json.loads(user_message["content"])
    assert sent == recipes


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


def test_missing_api_key_returns_500(client, monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = client.post(
        "/api/ai/merge",
        json={"recipes": [[_ingredient()]], "llm_provider": "openai"},
    )
    assert response.status_code == 500


def test_empty_recipes_list_still_calls_llm(
    client, mock_openai_client, sample_ingredient_json
):
    _set_llm_content(mock_openai_client, sample_ingredient_json)
    response = client.post("/api/ai/merge", json={"recipes": []})
    assert response.status_code == 200
    mock_openai_client.return_value.chat.completions.create.assert_called_once()
