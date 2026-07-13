# ByteBite

## Quick Start

### Run it locally with Docker Compose

Requires Docker Desktop.

```bash
cp .env.example .env    # then set LOGOS_KEY=... to enable the LLM (Optional step, otw canned responses)
docker compose up --build
```

Open http://localhost:8081.

Also started by compose: [Prometheus](http://localhost:9090) and
[Grafana](http://localhost:3000) (`admin` / `bytebite`), and the
[Swagger UI](http://localhost:8080/swagger-ui.html).

### The deployed app

| | URL | Login |
|---|---|---|
| **App** (Kubernetes) | https://team-bytebite.stud.k8s.aet.cit.tum.de | `admin@bytebite.dev` / `password` |
| **Swagger UI** | https://team-bytebite.stud.k8s.aet.cit.tum.de/swagger-ui.html | — |
| **Grafana** | https://team-bytebite.stud.k8s.aet.cit.tum.de/grafana | `admin` / `bytebite` |

The app also deploys to an **Azure VM** at `http://<public_ip>:8081`, with Prometheus on `:9090`
and Grafana on `:3000`. The IP is assigned by Terraform, get it from the GitHub Actions result.

Both deployments run automatically on every merge to `main`.

## 1. Problem Statement
Cooking a new meal often starts with inspiration from a blog, a social media post, or a handwritten note. However, the transition from "finding a recipe" to "having the ingredients" is filled with friction. Users often have to manually read through long descriptions, identify specific ingredients, estimate quantities, and then rewrite them into a categorized list suitable for a grocery store layout. 

**ByteBite** solves this by removing the manual labor of list-making. It addresses the user's need for efficiency and accuracy, ensuring no ingredient is overlooked and reducing the time spent planning meals.

## 2. Main Functionality
The core of the application is an intelligent parser that transforms unconcrete recipes into clearly structured lists with quantity estimations, allowing an improved shopping and cooking experience. Key features include:
* **Recipe Extraction:** Paste a full recipe text (including stories or instructions), and the app extracts only the necessary ingredients. Alternatively, paste the name of a recipe and the app will generate a full ingredients list.
* **Intelligent Categorization:** Ingredients are automatically grouped by grocery store aisles (e.g., Produce, Dairy, Spices, Meat).
* **Dietary Filtering & Substitution:** Users can state preferences (Vegan, Vegetarian, Gluten Free, Lactose Free). The app flags "red flag" ingredients and suggests a safe alternative for each.
* **Cross-Recipe Merging:** Combine several recipes into one shopping list. Duplicates are summed, and ingredients that mean the same thing under different names are merged into a single entry.

## 3. Intended Users
* **The Busy Professional:** Someone who wants to cook healthy meals but lacks the time to manually plan grocery trips.
* **The Home Cook:** Enthusiasts who love trying new recipes from diverse sources but find the organization part tedious.
* **Students on a Budget:** Users who need to ensure they only buy exactly what they need for a specific set of meals to avoid food waste.

## 4. Meaningful GenAI Integration
Unlike traditional apps that rely on rigid "If/Then" logic or specific input formatting, ByteBite uses Generative AI (LLMs) to leverage its knowledge of countless recipes. Each of the following would be impractical to implement with pattern matching or a fixed ingredient database:
* **Extraction from Unstructured Text:** The input is free-form, a dish name, a tidy ingredient list, or a rambling blog post. The model decides what is an ingredient and what is the author's story about their grandmother. No parser, delimiter, or expected format.
* **Knowledge-Based Generation:** Given only a dish name, the model produces the ingredients a typical recipe requires, drawing on what it already knows about that dish. There is no recipe database behind this.
* **Semantic Categorization:** Ingredients are assigned to a store aisle by meaning, not by lookup, "fresh basil" goes to Produce while "dried basil" goes to Spices, and "canned tomatoes" to Pantry while "fresh tomatoes" go to Produce.
* **Dietary Substitution:** Ingredients that violate a stated restriction are flagged, and the model proposes a substitute that fits the dish rather than a generic swap, lactose-free yogurt for heavy cream in a pan sauce.
* **Synonym-Aware Merging:** When several recipes are combined, the model recognizes that "cilantro" and "coriander" are the same purchase and sums them, while keeping "garlic clove" and "garlic powder" apart. It converts mismatched units before adding quantities.

Unit conversion to metric and quantity estimation for vague amounts ("salt to taste") also run through the model.

## 5. User Scenarios
### Scenario A: The Blog Post Parser
* **User Action:** Jason finds a 2,000-word blog post about "The Best Sunday Roast." He copies the entire text, including the author's life story, and pastes it into ByteBite.
* **App Action:** The AI ignores the anecdotes about the author's grandmother and generates a clean, metric list: "1500 g Beef Brisket" (Meat), "4 piece Carrots" (Produce), "Fresh Rosemary, N/A" (Produce), each already sorted into its aisle.

### Scenario B: The Lactose Dilemma
* **User Action:** Mark wants to cook Chicken Piccata, but he is lactose intolerant. He enters the dish and selects the **Lactose Free** filter before generating.
* **App Action:** The list comes back with heavy cream marked as restricted and shown alongside a suggested swap, lactose free yogurt, so Mark can see at a glance which item to replace and what to buy instead.

### Scenario C: Weekly Meal Prep
* **User Action:** A user saves three recipes for the week, Tacos, Stir-fry, and Salad, then selects all three and merges them into a single grocery list.
* **App Action:** The AI combines the three ingredient lists into one. Limes appear in all three recipes, so their quantities are added into a single entry instead of three. It also recognizes that the "coriander" in the Stir-fry and the "cilantro" in the Tacos are the same purchase and merges those too. The result is one aisle-sorted list with nothing bought twice.

## 6. Responsibilities

The project is split across three students, each owning one application area and one operations area.

| Student | Application | Operations |
| --- | --- | --- |
| **Jonathan** | GenAI: FastAPI service, prompt design, LLM providers | Azure deployment: Terraform and Ansible |
| **Malik** | Server: API gateway, user service, grocery service | Monitoring: Prometheus, Grafana dashboards and alerting |
| **Tim** | Client: React frontend | Kubernetes deployment |

These are main responsibilities, not exclusive ownership. The areas overlap in practice, and everyone
contributed outside their own column. The exact task distribution is tracked on the
[project board](https://github.com/AET-DevOps26/team-bytebite/projects).

## Project Layout

```
team-bytebite/
├── client/           # React + Vite frontend
├── gen-ai/           # Python FastAPI AI generation service
├── server/           # Java Spring Boot microservices
│   ├── api-gateway/      # Public entrypoint, routes requests to backend services
│   ├── user-service/     # User domain service
│   └── grocery-service/  # Grocery and recipe domain service
├── databases/        # Database image definitions and init schemas
├── helm/             # Helm chart for the Kubernetes deployment
├── infra/            # Terraform (Azure VM) + Ansible (configure & deploy)
├── monitoring/       # Prometheus scrape config, Grafana dashboards and alerts
└── documentation/    # Architecture diagrams (DrawIO + exported images)
```

Each directory has its own README with the details specific to it.

## Architecture Diagrams

Diagrams live in [documentation/](documentation/), as both editable `.drawio` sources and exported
images:

- [Component Diagram](documentation/ComponentDiagram.png), how the services fit together
- [Class Diagram](documentation/ClassDiagram.png), the domain model
- [DB Schema Diagram](documentation/DBSchemaDiagram.png), the user and grocery databases
- [Use Case Diagram](documentation/UseCaseDiagram.png), what users can do

## Services

### `client`, React / Vite
The user-facing web application. Provides a dish name input and displays the generated shopping list. Communicates with the backend via REST.

### `api-gateway`, Java Spring Boot
The public backend entrypoint. Receives frontend API requests and forwards them to the owning backend service.

### `user-service`, Java Spring Boot
Owns user-related data and connects to the user database.

### `grocery-service`, Java Spring Boot
Owns recipes, grocery lists, and grocery items. Connects to the grocery database and calls the gen-ai service when ingredient generation is needed.

### `gen-ai`, Python FastAPI
The AI generation service. Receives a dish name from the server and returns a shopping list with all required ingredients using LLM integrations.

## Getting Started

Each service has its own detailed setup instructions in its respective directory's README. A short summary also follows here.

### Local Development

Requires Java 21, Node 22, and Python 3.12. Each service runs in its own terminal.

**1. Gen-AI** (port 8000), create `gen-ai/.env` with `LOGOS_KEY=...`; add `OPENAI_API_KEY=sk-...` if you want to use the OpenAI switch. A local, offline option via [LM Studio](https://lmstudio.ai/) is also available, see `gen-ai/README.md`.
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

Every service is tested, and no test needs a running backend, database, or API key.

**Java** (JUnit), unit and lightweight integration tests:

- `api-gateway`: JWT gateway filter behavior, protected-route rejection, and trusted `X-User-*` header injection.
- `user-service`: registration/login validation, password hashing behavior, current-user lookup, and JWT signing/verification.
- `grocery-service`: grocery item mapping, list create/update behavior, merge behavior around Gen AI responses/failures, and controller HTTP behavior.

```bash
cd server/api-gateway && ./mvnw test
cd server/user-service && ./mvnw test
cd server/grocery-service && ./mvnw test
```

**Client** (Vitest + React Testing Library), unit tests for the API↔view-model mappers, component
tests driving real user interactions, and integration tests over the whole `App` with `fetch`
mocked at the network boundary. See [client/README.md](client/README.md#testing).

```bash
cd client && npm test
```

**Gen-AI** (pytest), both endpoints and their fallback paths, provider selection, prompt
construction, and JSON recovery, with the LLM client stubbed. [`pytest.ini`](gen-ai/pytest.ini)
enforces 85% coverage of `main.py`. See [gen-ai/README.md](gen-ai/README.md#tests).

```bash
cd gen-ai && pip install -r requirements-dev.txt && pytest
```

All three suites run in CI on every push.

---

### CI/CD

Three GitHub Actions workflows, in [.github/workflows/](.github/workflows/):

| Workflow | Trigger | What it does |
|---|---|---|
| [Test, Build and Push Images](.github/workflows/test-build-push.yml) | every push, any branch | Runs the Java, client, and gen-ai test suites in parallel. Only if all three pass does it build the Docker images. Images are pushed to GHCR on `main` only. |
| [Deploy to Kubernetes](.github/workflows/deploy-k8s.yml) | green build of `main` | `helm upgrade --install` to the AET cluster. |
| [Provision and Deploy](.github/workflows/deploy-azure.yml) | green build of `main` | `terraform apply` for the Azure VM, then the Ansible playbook to deploy onto it. |

So a failing test on any branch blocks the image build, and merging to `main` deploys to both
targets automatically. Both deploy workflows can also be run on demand from the Actions tab; a
manual run does not rerun the tests.

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

Copy [`.env.example`](.env.example) to `.env` and fill in `LOGOS_KEY` first. Compose reads it and
passes it to gen-ai. Without it, gen-ai still runs but serves a canned example ingredient list.

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

Open the Prometheus UI at http://localhost:9090, check http://localhost:9090/targets
to confirm every service is `UP`. The scrape configuration lives in
[`monitoring/prometheus.yml`](monitoring/prometheus.yml).

Open Grafana at http://localhost:3000 and log in with `admin` / `bytebite`, unless you override
`GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD`. Grafana is provisioned with the Prometheus
datasource and a `ByteBite / ByteBite Overview` dashboard from
[`monitoring/grafana`](monitoring/grafana).

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
helm upgrade --install bytebite ./helm/bytebite -f ./helm/bytebite/values-local.yaml --namespace team-bytebite --set genai.logosKey="lg-..." --atomic
helm uninstall bytebite --namespace team-bytebite  # To take down later
```

Open http://localhost:80

The local Helm values also expose monitoring services when supported by your
local cluster:

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (`admin` / `bytebite`)

#### Kubernetes Deployment to the AET cluster

Prerequisite: The `team-bytebite` namespace must exist in the cluster.

Deployment is automated via GitHub Actions:

- **Automatic:** every push to `main` triggers the build workflow, which triggers the deploy workflow on success.
- **Manual:** go to Actions → *Deploy to Kubernetes* → *Run workflow* to manually start the deploy workflow.


Alternatively, you can do manual deployment with Helm:
(Requires `helm` and a valid kubeconfig)

```bash
kubectl config use-context stud
helm upgrade --install bytebite ./helm/bytebite --namespace team-bytebite --set genai.logosKey="lg-..." --atomic
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
`GRAFANA_ADMIN_PASSWORD` GitHub Actions secret, and the chart falls back to the same
`admin` / `bytebite` used everywhere else.

---

### Azure VM (Terraform + Ansible)

A second, independent deployment target: a single Azure VM running the same `compose.yaml` stack.
Infrastructure and configuration are split across two tools.

| Step | Tool | What it does |
| --- | --- | --- |
| Provision | [Terraform](infra/terraform/) | Resource group, network, NSG, public IP, Ubuntu VM, SSH keypair. State lives remotely in Azure Storage. Writes an Ansible inventory + SSH key on `apply`. |
| Configure & deploy | [Ansible](infra/ansible/) | Installs Docker, copies `compose.yaml` + monitoring config + a rendered `.env`, logs into GHCR, and runs `docker compose up -d --pull=always`. Images are pulled, never built on the VM. |

[`.github/workflows/deploy-azure.yml`](.github/workflows/deploy-azure.yml) (*Provision and Deploy*)
runs both steps in one job, automatically after a green build of `main` and on demand via
*Run workflow*. `terraform apply` is idempotent, so an unchanged infrastructure is a no-op and only
the Ansible deploy does work.

To run it by hand, see [infra/terraform/README.md](infra/terraform/README.md) followed by
[infra/ansible/README.md](infra/ansible/README.md), Terraform hands its generated inventory and
SSH key straight to Ansible.

After a deploy, the app is at `http://<public_ip>:8081`, Prometheus at `http://<public_ip>:9090`,
and Grafana at `http://<public_ip>:3000`.
