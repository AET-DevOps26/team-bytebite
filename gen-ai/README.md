# gen-ai

Python FastAPI AI generation service for ByteBite. It turns a dish name or raw recipe text into a
structured, categorized, metric-unit ingredient list, and merges several such lists into one
deduplicated shopping list.

## Prerequisites

- Python 3.12 or newer (CI runs 3.12)

## Setup & Run

Create a `.env` file first:

```env
LOGOS_KEY=...
OPENAI_API_KEY=sk-...
```

`LOGOS_KEY` is used by default. `OPENAI_API_KEY` is only required when the OpenAI provider is selected.

**macOS / Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload   # starts on http://localhost:8000
```

**Windows (PowerShell)**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload   # starts on http://localhost:8000
```

**Windows (Command Prompt)**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
uvicorn main:app --reload
```

## LLM providers

Requests select a provider via `llm_provider`. Anything unrecognized falls back to `logos`, and
selecting `openai` without `OPENAI_API_KEY` set also falls back to `logos`, the service never
fails a request just because a provider is unavailable.

| Provider | Model | Requires |
|---|---|---|
| `logos` *(default)* | `openai/gpt-oss-120b` via the TUM Logos gateway | `LOGOS_KEY` |
| `openai` | `gpt-4o-mini` | `OPENAI_API_KEY` |
| `local` | whatever LM Studio is serving | LM Studio running (see below) |

If the selected provider errors, times out, or returns unparseable JSON, the service degrades
instead of failing: `/api/ai/parse` returns a canned example list, and `/api/ai/merge` returns the
submitted ingredients unmerged. Both set a `note` field explaining why. The UI therefore always has
something to display, this is deliberate, and keeps a missing API key from breaking a demo.

### Local LLM (LM Studio)

To use a model running locally instead of a hosted provider:

1. Install [LM Studio](https://lmstudio.ai/), download a model, and load it.
2. In LM Studio's Developer tab, start the local server (default port `1234`) and note the model identifier it reports.
3. Add to `gen-ai/.env`:
   ```env
   LM_STUDIO_BASE_URL=http://localhost:1234/v1
   LM_STUDIO_MODEL=<model-identifier-from-lm-studio>
   ```
   Both are optional, defaulting to `http://localhost:1234/v1` and `local-model` respectively, but `LM_STUDIO_MODEL` must match the identifier LM Studio reports or requests will 404 (which gen-ai handles gracefully by falling back to a canned example response).
4. Select `"local"` as the `llm_provider` in requests (or the "Local" option in the client UI).

If gen-ai runs via `docker compose up` instead of `uvicorn` directly, point `LM_STUDIO_BASE_URL` at `http://host.docker.internal:1234/v1` instead of `localhost` so the container can reach LM Studio on the host, `compose.yaml` already defaults to this for you.

## Endpoints

The service API is `POST /api/ai/parse` and `POST /api/ai/merge`. The client never
calls them directly, `grocery-service` does. For the full request and response shapes, use the
Swagger UI at http://localhost:8000/docs, or the gateway's aggregated UI at
http://localhost:8080/swagger-ui.html. Both are generated from the code, so they cannot drift
from it.

Operational endpoints:

| Path | Purpose |
|---|---|
| `/health` | Health check; reports whether OpenAI is configured |
| `/metrics` | Prometheus metrics (scraped by the monitoring stack) |
| `/docs` | Swagger UI |

### POST /api/ai/parse

Accepts either a dish name (ingredients are generated) or full recipe text including prose
(ingredients are extracted, narrative ignored). Ingredients flagged against a dietary restriction
come back with `restricted: true` and an `alternative` where one exists.

```json
{
  "dish": "Chicken Piccata",
  "dietary_restrictions": ["Lactose Free"],
  "llm_provider": "logos"
}
```

`dietary_restrictions` accepts `Vegan`, `Vegetarian`, `Gluten Free`, and `Lactose Free`.

### POST /api/ai/merge

Combines lists, summing quantities for duplicates and for synonyms ("cilantro" / "coriander",
"courgette" / "zucchini"). Genuinely distinct items ("garlic clove" vs "garlic powder") are kept
apart.

```json
{
  "recipes": [
    [{ "name": "Limes", "quantity": "2", "unit": "piece", "category": "Produce" }],
    [{ "name": "Limes", "quantity": "2", "unit": "piece", "category": "Produce" }]
  ],
  "llm_provider": "logos"
}
```

## Tests

Tests use `pytest` against FastAPI's `TestClient`, with the LLM client stubbed, no API key,
network, or running server needed.

```bash
pip install -r requirements-dev.txt
pytest                    # from gen-ai/
pytest tests/test_endpoint_merge.py     # a single file
```

[`pytest.ini`](pytest.ini) enforces **85% line coverage** across all service modules; the run fails below that.

Coverage spans the two endpoints and their fallback paths
([`test_endpoint_parse.py`](tests/test_endpoint_parse.py),
[`test_endpoint_merge.py`](tests/test_endpoint_merge.py)), health
([`test_endpoint_health.py`](tests/test_endpoint_health.py)), provider selection and the
fallback-to-Logos rules ([`test_provider.py`](tests/test_provider.py)), the lenient JSON extraction
that recovers a payload an LLM wrapped in markdown fences
([`test_parse_json_content.py`](tests/test_parse_json_content.py)), and prompt construction for
dietary restrictions ([`test_prompts.py`](tests/test_prompts.py)).

CI runs the same suite in [`test-build-push.yml`](../.github/workflows/test-build-push.yml) and it
gates the image build, so a failing test blocks the merge.
