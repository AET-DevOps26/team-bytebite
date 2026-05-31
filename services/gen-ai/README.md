# gen-ai

Python FastAPI AI generation service for ByteBite.

## Prerequisites

- Python 3.11+

## Setup & Run

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
| POST   | /generate  | Generate ingredient list for a dish name |

### POST /generate

Request body:
```json
{ "dish": "Chicken Piccata" }
```
