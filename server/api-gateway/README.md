# api-gateway

Spring Cloud Gateway — the public entrypoint for ByteBite (port 8080). It holds no business
logic: it routes requests to the owning service and verifies JWTs on the way through.

## Prerequisites

- Java 21
- `user-service` and `grocery-service` reachable (see below)

## Run

```bash
./mvnw spring-boot:run    # macOS / Linux — starts on http://localhost:8080
mvnw.cmd spring-boot:run  # Windows
./mvnw test
```

## Routes

| Path | Routed to |
|---|---|
| `/api/recipes/**` | grocery-service (`:8082`) |
| `/api/grocery-list/**` | grocery-service (`:8082`) |
| `/api/auth/**` | user-service (`:8083`) |
| `/api/users/**` | user-service (`:8083`) |

Three further routes proxy the downstream OpenAPI specs so the gateway can serve one aggregated
Swagger UI: `/v3/api-docs/{user-service,grocery-service,gen-ai}`.

Route targets default to `localhost` and are overridden per environment via
`USER_SERVICE_BASE_URL`, `GROCERY_SERVICE_BASE_URL`, and `GENAI_SERVICE_BASE_URL`.

## Authentication

[`JwtAuthenticationFilter`](src/main/java/com/bytebite/server/JwtAuthenticationFilter.java) runs
before routing on every `/api/**` request except `/api/auth/**` (register and login must stay
public). It expects an `Authorization: Bearer <token>` header and rejects a missing, malformed,
badly signed, or expired token with `401`.

On success it injects the caller's identity as `X-User-Id` and `X-User-Email` headers. These are
written with `set()`, not `add()`, so any values a client tried to supply are overwritten — the
downstream services can trust them.

`JWT_SECRET` must be at least 32 characters, and must match the secret `user-service` signs tokens
with. It defaults to a development value; override it in every real environment.

## Endpoints

The gateway exposes no API of its own. Its own operational endpoints are:

| Path | Purpose |
|---|---|
| `/actuator/health` | Health check |
| `/actuator/prometheus` | Prometheus metrics |
| `/swagger-ui.html` | Aggregated API docs for all backend services |

For the application API, use the Swagger UI — it is generated from the services and never goes
stale.
