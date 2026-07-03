# ByteBite Helm Chart

Deploys the ByteBite application (client, api-gateway, user-service, grocery-service, gen-ai)
and the optional monitoring stack (Prometheus + Grafana) to Kubernetes.

## Prerequisites

- Kubernetes cluster with nginx ingress controller and cert-manager
- Helm 3+
- Docker images pushed to `ghcr.io/aet-devops26/team-bytebite/`

## Install

```bash
helm upgrade --install bytebite ./helm/bytebite --namespace team-bytebite --set genai.logosKey=... --set genai.openaiApiKey=sk-...
```

## Uninstall

```bash
helm uninstall bytebite --namespace team-bytebite
```

## Parameters

| Parameter | Description | Default |
|---|---|---|
| `namespace` | Namespace to deploy into | `team-bytebite` |
| `ingress.host` | Public hostname | `team-bytebite.stud.k8s.aet.cit.tum.de` |
| `ingress.tls` | Enable TLS via cert-manager | `true` |
| `genai.logosKey` | Logos API key for the default gen-ai provider | `""` |
| `genai.openaiApiKey` | OpenAI API key for the selectable OpenAI provider | `""` |
| `monitoring.enabled` | Deploy Prometheus and Grafana | `true` |
| `monitoring.grafana.adminUser` | Grafana admin username | `admin` |
| `monitoring.grafana.adminPassword` | Grafana admin password | `bytebite` |
| `monitoring.grafana.ingress.enabled` | Expose Grafana under the main ingress host | `true` |
| `monitoring.grafana.ingress.path` | Grafana ingress path | `/grafana` |
| `client.image.tag` | Client image tag | `latest` |
| `apiGateway.image.tag` | API gateway image tag | `latest` |
| `userService.image.tag` | User service image tag | `latest` |
| `groceryService.image.tag` | Grocery service image tag | `latest` |
| `genai.image.tag` | Gen-AI image tag | `latest` |
