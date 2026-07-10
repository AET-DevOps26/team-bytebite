# ByteBite

## 1. Problem Statement
Cooking a new meal often starts with inspiration from a blog, a social media post, or a handwritten note. However, the transition from "finding a recipe" to "having the ingredients" is filled with friction. Users often have to manually read through long descriptions, identify specific ingredients, estimate quantities, and then rewrite them into a categorized list suitable for a grocery store layout. 

**ByteBite** solves this by removing the manual labor of list-making. It addresses the user's need for efficiency and accuracy, ensuring no ingredient is overlooked and reducing the time spent planning meals.

## 2. Main Functionality
The core of the application is an intelligent parser that transforms unconcrete recipes into clearly structured lists with quantity estimations, allowing an improved shopping and cooking experience. Key features include:
* **Recipe Extraction:** Paste a full recipe text (including stories or instructions), and the app extracts only the necessary ingredients. Alternatively, paste the name of a recipe and the app will generate a full ingredients list.
* **Intelligent Categorization:** Ingredients are automatically grouped by grocery store aisles (e.g., Produce, Dairy, Spices, Meat).
* **Dietary & Allergy Filtering:** Users can state preferences (e.g., Vegan, Vegetarian, Gluten-Free, Lactose-Free). The app automatically identifies "red flag" ingredients and suggests safe alternatives.

## 3. Intended Users
* **The Busy Professional:** Someone who wants to cook healthy meals but lacks the time to manually plan grocery trips.
* **The Home Cook:** Enthusiasts who love trying new recipes from diverse sources but find the organization part tedious.
* **Students on a Budget:** Users who need to ensure they only buy exactly what they need for a specific set of meals to avoid food waste.

## 4. Meaningful GenAI Integration
Unlike traditional apps that rely on rigid "If/Then" logic or specific formatting, ByteBite uses Generative AI (LLMs) to leverage its knowledge of countless recipes to generate custom grocery lists personalized to the users instructions:
* **Substitution Logic:** If a recipe calls for an obscure ingredient, the GenAI can suggest common alternatives directly on the shopping list.
* **Scaling & Adjustments:** Users can ask the AI to "Scale this recipe for 6 people instead of 2," and the shopping list will update dynamically using the AI's mathematical reasoning.

## 5. User Scenarios
### Scenario A: The Blog Post Parser
* **User Action:** Jason finds a 2,000-word blog post about "The Best Sunday Roast." He copies the entire text, including the author's life story, and pastes it into ByteBite.
* **App Action:** The AI ignores the anecdotes about the author's grandmother and generates a clean list: "1.5kg Beef Brisket, 4 Large Carrots, 2 Sprigs of Rosemary."

### Scenario B: The Lactose Dilemma
* **User Action:** Mark asks for a recipe for Chicken Piccata but wants to know if he can swap the heavy cream for something lactose free.
* **App Action:** He asks the integrated AI assistant. The AI suggests using lactose free yogurt and automatically updates his shopping list with the alternative ingredient.

### Scenario C: Weekly Meal Prep
* **User Action:** A user adds three different recipes for the week: Tacos, Stir-fry, and Salad.
* **App Action:** The app identifies that all three recipes require "cilantro" and "lime." Instead of three separate entries, it provides a total count (e.g., "2 Bunches of Cilantro, 4 Limes") and sorts them into the 'Produce' section for a single trip through that aisle.

## Project Layout

```
team-bytebite/
├── client/           # React + Vite frontend
├── gen-ai/           # Python FastAPI AI generation service
├── server/           # Java Spring Boot microservices
│   ├── api-gateway/      # Public entrypoint — routes requests to backend services
│   ├── user-service/     # User domain service
│   └── grocery-service/  # Grocery and recipe domain service
└── databases/        # Database image definitions and init schemas
```

## Services

### `client` — React / Vite
The user-facing web application. Provides a dish name input and displays the generated shopping list. Communicates with the backend via REST.

### `api-gateway` — Java Spring Boot
The public backend entrypoint. Receives frontend API requests and forwards them to the owning backend service.

### `user-service` — Java Spring Boot
Owns user-related data and connects to the user database.

### `grocery-service` — Java Spring Boot
Owns recipes, grocery lists, and grocery items. Connects to the grocery database and calls the gen-ai service when ingredient generation is needed.

### `gen-ai` — Python FastAPI
The AI generation service. Receives a dish name from the server and returns a shopping list with all required ingredients using LLM integrations.

## Getting Started

Each service has its own detailed setup instructions in its respective directory's README. A short summary also follows here.

### Local Development

Requires Java 21, Node 22, and Python 3.12. Each service runs in its own terminal.

**1. Gen-AI** (port 8000) — create `gen-ai/.env` with `LOGOS_KEY=...`; add `OPENAI_API_KEY=sk-...` if you want to use the OpenAI switch. A local, offline option via [LM Studio](https://lmstudio.ai/) is also available — see `gen-ai/README.md`.
```bash
cd gen-ai
python -m venv .venv
.venv/Scripts/Activate.ps1   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

**2. User Service** (port 8083)
```bash
cd server/user-service
./mvnw spring-boot:run
```

**3. Grocery Service** (port 8082)
```bash
cd server/grocery-service
./mvnw spring-boot:run
```

**4. API Gateway** (port 8080)
```bash
cd server/api-gateway
./mvnw spring-boot:run
```

**5. Client** (port 5173)
```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

### API Documentation

When the backend services are running, the API gateway exposes the aggregated Swagger UI at:

```text
http://localhost:8080/swagger-ui.html
```

The UI includes the User Service, Grocery Service, and Gen AI Service OpenAPI definitions. The raw specs are available through the gateway at `/v3/api-docs/user-service`, `/v3/api-docs/grocery-service`, and `/v3/api-docs/gen-ai`.

---

### Testing

The Java server components have unit and lightweight integration tests:

- `api-gateway`: JWT gateway filter behavior, protected-route rejection, and trusted `X-User-*` header injection.
- `user-service`: registration/login validation, password hashing behavior, current-user lookup, and JWT signing/verification.
- `grocery-service`: grocery item mapping, list create/update behavior, merge behavior around Gen AI responses/failures, and controller HTTP behavior.

Run them locally with:

```bash
cd server/api-gateway && ./mvnw test
cd server/user-service && ./mvnw test
cd server/grocery-service && ./mvnw test
```

GitHub Actions runs the same Maven test matrix in `Test, Build and Push Images`
before building/pushing images. Automatic Kubernetes and Azure deployments are
triggered only after that workflow succeeds; manual deployment workflow runs do
not rerun the Java tests.

---

### Linting / Static Analysis

Every service is linted in CI (`Test, Build and Push Images`) as a **blocking gate** —
a lint failure fails the build and prevents images from being pushed or deployed.

| Service | Tool | Run locally |
|---------|------|-------------|
| `client` | ESLint | `cd client && npm run lint` |
| `gen-ai` | [Ruff](https://docs.astral.sh/ruff/) | `cd gen-ai && ruff check .` |
| `api-gateway`, `user-service`, `grocery-service` | [Spotless](https://github.com/diffplug/spotless) (google-java-format) | `cd server/<service> && ./mvnw spotless:check` |

For the Java services, auto-format any violations with `./mvnw spotless:apply`.
Ruff config lives in `gen-ai/pyproject.toml`; ESLint config in `client/eslint.config.js`.

---

### Docker

Requires Docker Desktop running.

```powershell
docker compose up --build
docker compose down  # To take down later
```

Open http://localhost:8081

Drop `--build` on subsequent starts if nothing has changed. To stop: `docker compose down`.

#### Monitoring (Prometheus + Grafana)

`docker compose up` also starts Prometheus and Grafana. Prometheus scrapes metrics
from all backend services. The Spring services expose metrics at
`/actuator/prometheus` (via Spring Boot Actuator + Micrometer) and `gen-ai` exposes
them at `/metrics`.

Open the Prometheus UI at http://localhost:9090 — check http://localhost:9090/targets
to confirm every service is `UP`. The scrape configuration lives in
[`monitoring/prometheus.yml`](monitoring/prometheus.yml).

Open Grafana at http://localhost:3000 and log in with `admin` / `bytebite` unless
you override `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD`. Grafana is
provisioned with the Prometheus datasource and a `ByteBite / ByteBite Overview`
dashboard from [`monitoring/grafana`](monitoring/grafana).

Grafana also provisions a `ByteBite service down` alert. It evaluates the
Prometheus `up` metric every 30 seconds and fires when any scraped ByteBite
target stays down for at least 1 minute. In Grafana, open **Alerting** to see
the rule state and active firing alerts.

---

### Kubernetes

#### Local Kubernetes Deployment

Requires a local Kubernetes cluster running via Docker Desktop.

```powershell
kubectl config use-context docker-desktop
kubectl create namespace team-bytebite
helm upgrade --install bytebite ./helm/bytebite -f ./helm/bytebite/values-local.yaml --namespace team-bytebite --set genai.openaiApiKey="sk-..." --atomic
helm uninstall bytebite --namespace team-bytebite  # To take down later
```

Open http://localhost:80

The local Helm values also expose monitoring services when supported by your
local cluster:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (`admin` / `admin`, the chart fallback)

#### Kubernetes Deployment to the AET cluster

Prerequisite: The `team-bytebite` namespace must exist in the cluster.

Deployment is automated via GitHub Actions:

- **Automatic:** every push to `main` triggers the build workflow, which triggers the deploy workflow on success.
- **Manual:** go to Actions → *Deploy to Kubernetes* → *Run workflow* to manually start the deploy workflow.


Alternatively, you can do manual deployment with Helm:
(Requires `helm` and a valid kubeconfig)

```bash
kubectl config use-context stud
helm upgrade --install bytebite ./helm/bytebite --namespace team-bytebite --set genai.openaiApiKey="sk-..." --atomic
helm uninstall bytebite --namespace team-bytebite  # To take down later
```

The app is available at https://team-bytebite.stud.k8s.aet.cit.tum.de
Grafana is available at https://team-bytebite.stud.k8s.aet.cit.tum.de/grafana
when `monitoring.enabled` and `monitoring.grafana.ingress.enabled` are true.

#### Login credentials

For evaluation, both the deployed app and Grafana come with a ready-to-use login:

| Service | URL | Username | Password |
| --- | --- | --- | --- |
| ByteBite app | https://team-bytebite.stud.k8s.aet.cit.tum.de | `admin@bytebite.dev` | `password` |
| Grafana | https://team-bytebite.stud.k8s.aet.cit.tum.de/grafana | `admin` | `bytebite` |

The app account is seeded by [`databases/user-db/init.sql`](databases/user-db/init.sql); you can
also self-register a new account. The Grafana password is supplied at deploy time via the
`GRAFANA_ADMIN_PASSWORD` GitHub Actions secret — the chart's built-in fallback is `admin` / `admin`.
