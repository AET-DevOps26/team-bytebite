# ByteBite Helm Chart

Deploys the ByteBite application (client, server, gen-ai) to Kubernetes.

## Prerequisites

- Kubernetes cluster with nginx ingress controller and cert-manager
- Helm 3+
- Docker images pushed to `ghcr.io/aet-devops26/team-bytebite/`

## Install

```bash
helm upgrade --install bytebite ./helm/bytebite --namespace team-bytebite --set genai.openaiApiKey=sk-...
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
| `genai.openaiApiKey` | OpenAI API key for the gen-ai service | `""` |
| `client.image.tag` | Client image tag | `latest` |
| `server.image.tag` | Server image tag | `latest` |
| `genai.image.tag` | Gen-AI image tag | `latest` |
