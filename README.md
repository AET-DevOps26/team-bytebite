# ByteBite

ByteBite is an AI-powered shopping list generation app. Users enter a dish name and the app generates the shopping list with all ingredients needed to make it.

## Project Layout

```
team-bytebite/
├── client/       # React + Vite frontend
├── server/       # Java Spring Boot backend API
└── gen-ai/       # Python FastAPI service for AI-based recipe and shopping list generation
```

## Services

### `client` — React / Vite
The user-facing web application. Provides a dish name input and displays the generated shopping list. Communicates with the backend via REST.

### `server` — Java Spring Boot
The core backend API. Manages users, recipes, and shopping lists. Orchestrates requests between the client and the gen-ai service.

### `gen-ai` — Python FastAPI
The AI generation service. Receives a dish name from the server and returns a shopping list with all required ingredients using LLM integrations.

## Getting Started

Each service has its own setup instructions in its respective directory's README.
