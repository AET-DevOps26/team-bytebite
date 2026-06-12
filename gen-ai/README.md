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
