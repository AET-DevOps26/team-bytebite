# grocery-service

Spring Boot service owning recipes, grocery lists, and grocery items (port 8082). It reads and
writes the grocery database, and calls `gen-ai` when a recipe needs its ingredients generated.

## Prerequisites

- Java 21
- The grocery Postgres database running (`docker compose up grocery-db`, or the full stack)
- `gen-ai` running on port 8000, for the generation endpoints

## Run

```bash
./mvnw spring-boot:run    # macOS / Linux, starts on http://localhost:8082
mvnw.cmd spring-boot:run  # Windows
./mvnw test
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/grocerydb` | Grocery database |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | Database password |
| `GENAI_BASE_URL` | `http://localhost:8000` | Where to reach `gen-ai` |
| `SERVER_PORT` | `8082` | Overridden to `8080` in containers |

`application.properties` also honors `GROCERY_DB_URL`, `GROCERY_DB_USER`, and `GROCERY_DB_PASSWORD`
as aliases, but nothing sets them, `compose.yaml` and the Helm chart both use the
`SPRING_DATASOURCE_*` names above, which take precedence over the properties file. Prefer those.

Hibernate runs with `ddl-auto=none`, the schema is owned by the init scripts in
[`databases/grocery-db`](../../databases/grocery-db), not generated from the entities. Schema
changes belong there.

## Endpoints

Recipes and grocery lists are exposed under `/api/recipes` and `/api/grocery-list`, plus
`POST /api/recipes/generate` (generate ingredients for a dish) and `GET /api/recipes/providers`
(the LLM providers the client may select). For the full request and response shapes, use the
aggregated Swagger UI at http://localhost:8080/swagger-ui.html while the gateway is running —
it is generated from the code, so it cannot drift from it.

Operational endpoints:

| Path | Purpose |
|---|---|
| `/health` | Health check |
| `/actuator/health` | Health check (actuator) |
| `/actuator/prometheus` | Prometheus metrics |

In production the service is reached through the api-gateway, which strips the `Authorization`
header and replaces it with trusted `X-User-Id` and `X-User-Email` headers. Requests that arrive
without those headers were not authenticated.

## Tests

`./mvnw test` covers grocery-item mapping, grocery-list create and update behavior, the merge
path's handling of both successful and failing Gen AI responses, and controller-level HTTP
behavior. The same suite runs in CI and gates the image build.
