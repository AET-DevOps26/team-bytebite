def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "openai_available": True}


def test_health_reports_openai_unavailable_without_key(client, monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["openai_available"] is False
