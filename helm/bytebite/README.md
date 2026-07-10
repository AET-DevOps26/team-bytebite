# ByteBite Helm Chart

Deploys the ByteBite application (client, api-gateway, user-service, grocery-service, gen-ai)
and the optional monitoring stack (Prometheus + Grafana) to Kubernetes.

When monitoring is enabled, Grafana is provisioned with the ByteBite dashboard,
the Prometheus datasource, and a `ByteBite service down` alert that fires when
any scraped service reports `up == 0` for at least 1 minute.

## Prerequisites

- Kubernetes cluster with nginx ingress controller and cert-manager
- Helm 3+
- Docker images pushed to `ghcr.io/aet-devops26/team-bytebite/`

## Install

```bash
helm upgrade --install bytebite ./helm/bytebite --namespace team-bytebite \
  --set genai.logosKey=... \
  --set jwt.secret=<32+ chars> \
  --set userDb.password=... --set groceryDb.password=...
```

For a local cluster (Docker Desktop), layer on [`values-local.yaml`](values-local.yaml), which
disables the ingress, exposes the client and monitoring services as `LoadBalancer`, and supplies
development database passwords:

```bash
helm upgrade --install bytebite ./helm/bytebite -f ./helm/bytebite/values-local.yaml \
  --namespace team-bytebite --set genai.logosKey=...
```

## Uninstall

```bash
helm uninstall bytebite --namespace team-bytebite
```

## Parameters

### Secrets

Every one of these has a development fallback, so the chart installs without any `--set` — useful
for local clusters and demos. **Override them for a real deploy.** CI passes them from GitHub
secrets in [`deploy-k8s.yml`](../../.github/workflows/deploy-k8s.yml).

| Parameter | Description | Default |
|---|---|---|
| `genai.logosKey` | Logos API key for the default gen-ai provider | `""` — gen-ai serves canned example data |
| `genai.openaiApiKey` | OpenAI API key for the selectable OpenAI provider | `""` — OpenAI option unavailable |
| `jwt.secret` | Shared signing key — user-service signs, api-gateway verifies. **≥ 32 chars.** | `""` — apps use their built-in dev key |
| `userDb.password` | User database password | `bytebite_user_password` |
| `groceryDb.password` | Grocery database password | `bytebite_grocery_password` |

The database passwords fall back in [`secret.yaml`](templates/secret.yaml) rather than in
`values.yaml`: the databases mount `emptyDir` and re-initialize on every pod start, and Postgres
refuses to initialize with an empty password. A `values.yaml` default would not help, because
`--set userDb.password=""` — what CI produces when a repo secret is missing — would override it.

### Deployment

| Parameter | Description | Default |
|---|---|---|
| `namespace` | Namespace to deploy into | `team-bytebite` |
| `ingress.enabled` | Create an ingress (disable for local clusters) | `true` |
| `ingress.className` | Ingress class | `nginx` |
| `ingress.host` | Public hostname | `team-bytebite.stud.k8s.aet.cit.tum.de` |
| `ingress.tls` | Enable TLS via cert-manager | `true` |
| `client.image.tag` | Client image tag | `latest` |
| `apiGateway.image.tag` | API gateway image tag | `latest` |
| `userService.image.tag` | User service image tag | `latest` |
| `groceryService.image.tag` | Grocery service image tag | `latest` |
| `genai.image.tag` | Gen-AI image tag | `latest` |
| `userDb.image.tag` / `groceryDb.image.tag` | Database image tags | `latest` |

Each service also accepts `image.repository`, `image.pullPolicy`, `replicaCount`, and `service.*`.

### Monitoring

| Parameter | Description | Default |
|---|---|---|
| `monitoring.enabled` | Deploy Prometheus and Grafana | `true` |
| `monitoring.prometheus.scrapeInterval` | Scrape interval | `15s` |
| `monitoring.grafana.adminUser` | Grafana admin username | `admin` |
| `monitoring.grafana.adminPassword` | Grafana admin password — fallback only; CI overrides via the `GRAFANA_ADMIN_PASSWORD` secret | `admin` |
| `monitoring.grafana.ingress.enabled` | Expose Grafana under the main ingress host | `true` |
| `monitoring.grafana.ingress.path` | Grafana ingress path | `/grafana` |
