# gen-ai

Python FastAPI AI generation service for ByteBite.

## Prerequisites

- Python 3.11+

## Setup & Run

Create a `.env` file first:

```env
LOGOS_KEY=...
OPENAI_API_KEY=sk-...
```

`LOGOS_KEY` is used by default. `OPENAI_API_KEY` is only required when the OpenAI provider is selected.

### Local LLM (LM Studio)

To use a model running locally instead of a hosted provider:

1. Install [LM Studio](https://lmstudio.ai/), download a model, and load it.
2. In LM Studio's Developer tab, start the local server (default port `1234`) and note the model identifier it reports.
3. Add to `gen-ai/.env`:
   ```env
   LM_STUDIO_BASE_URL=http://localhost:1234/v1
   LM_STUDIO_MODEL=<model-identifier-from-lm-studio>
   ```
   Both are optional — they default to `http://localhost:1234/v1` and `local-model` respectively — but `LM_STUDIO_MODEL` must match the identifier LM Studio reports or requests will 404 (which gen-ai handles gracefully by falling back to a canned example response).
4. Select `"local"` as the `llm_provider` in requests (or the "Local" option in the client UI).

If gen-ai runs via `docker compose up` instead of `uvicorn` directly, point `LM_STUDIO_BASE_URL` at `http://host.docker.internal:1234/v1` instead of `localhost` so the container can reach LM Studio on the host — `compose.yaml` already defaults to this for you.

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

## Endpoints

| Method | Path       | Description                              |
|--------|------------|------------------------------------------|
| GET    | /health    | Health check                             |
| POST   | /api/ai/parse | Generate ingredient list for a dish name |
| POST   | /api/ai/merge | Merge ingredient lists |

### POST /api/ai/parse

Request body:
```json
{ "dish": "Chicken Piccata", "llm_provider": "logos" }
```
