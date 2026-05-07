# server

Java Spring Boot backend API for ByteBite.

## Prerequisites

- Java 21

## Setup & Run

**macOS / Linux**
```bash
./mvnw spring-boot:run   # starts on http://localhost:8080
```

**Windows**
```cmd
mvnw.cmd spring-boot:run
```

## Other Commands

| | macOS / Linux | Windows |
|-|---------------|---------|
| Build | `./mvnw package` | `mvnw.cmd package` |
| Test | `./mvnw test` | `mvnw.cmd test` |

## Endpoints

| Method | Path      | Description   |
|--------|-----------|---------------|
| GET    | /health   | Health check  |
