# user-service

Spring Boot service owning user accounts and authentication (port 8083). It registers users,
verifies passwords, and issues the JWTs that the api-gateway later verifies.

## Prerequisites

- Java 21
- The user Postgres database running (`docker compose up user-db`, or the full stack)

## Run

```bash
./mvnw spring-boot:run    # macOS / Linux, starts on http://localhost:8083
mvnw.cmd spring-boot:run  # Windows
./mvnw test
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/bytebite_user` | User database |
| `SPRING_DATASOURCE_USERNAME` | `bytebite_user` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | `bytebite_user_password` | Database password |
| `JWT_SECRET` | development value | HMAC-SHA256 signing key, **≥ 32 characters** |
| `JWT_EXPIRATION_SECONDS` | `86400` | Token lifetime (24h) |
| `SERVER_PORT` | `8083` | Overridden to `8080` in containers |

`JWT_SECRET` must be identical to the one the [api-gateway](../api-gateway/README.md) verifies
with, this service signs, the gateway verifies. Override the default in every real environment.

The schema and the seeded evaluation account come from
[`databases/user-db/init.sql`](../../databases/user-db/init.sql).

## Endpoints

`POST /api/auth/register` and `POST /api/auth/login` are public and return a JWT.
`GET`/`PATCH /api/users/me` and `PUT /api/users/me/password` operate on the current user. For the
full request and response shapes, use the aggregated Swagger UI at
http://localhost:8080/swagger-ui.html while the gateway is running — it is generated from the
code, so it cannot drift from it.

Operational endpoints:

| Path | Purpose |
|---|---|
| `/health` | Health check |
| `/actuator/health` | Health check (actuator) |
| `/actuator/prometheus` | Prometheus metrics |

The current user is read from the trusted `X-User-Id` / `X-User-Email` headers the gateway
injects — never from the request body.

## Tests

`./mvnw test` covers registration and login validation, password hashing behavior, current-user
lookup, and JWT signing and verification. The same suite runs in CI and gates the image build.
