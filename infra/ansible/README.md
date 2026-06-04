# Ansible — ByteBite VM configuration & deploy

Takes the bare VM that [`../terraform`](../terraform) provisions and turns it into a running
ByteBite deployment. This is the **configuration** half of the infra story: Terraform hands over a
reachable VM (with Python 3) plus an inventory and SSH key; Ansible installs Docker and brings the
Compose stack up.

```
terraform apply  ──▶  inventory.ini + ssh_key.pem  ──▶  ansible-playbook site.yml
   (bare VM)            (written here, gitignored)         (Docker + app stack)
```

## What it does

| Role | Does |
|------|------|
| `docker` | Installs Docker Engine + the Compose v2 plugin from Docker's official apt repo; enables the service; adds the deploy user to the `docker` group |
| `deploy` | Copies the repo-root `compose.yaml` and a rendered `.env` to `/opt/bytebite`, logs into GHCR, pulls images, and runs `docker compose up -d` |

The CI workflow [`deploy.yml`](../../.github/workflows/deploy.yml) runs Terraform and then this same
playbook in one job, on every green build of `main`.

## Layout

```
ansible.cfg                 # inventory = inventory.ini, roles_path, ssh opts
site.yml                    # the play: hosts: bytebite, roles: docker -> deploy
group_vars/bytebite.yml     # defaults (app_dir, registry, image_tag, ...)
deploy-vars.example.yml     # template for runtime/secret vars (-e @deploy-vars.yml)
roles/docker/               # Docker Engine install
roles/deploy/               # compose.yaml + .env + compose up
inventory.ini  (gitignored) # written by `terraform apply`
ssh_key.pem    (gitignored) # written by `terraform apply` (generated keys only)
```

## Run it locally

Prerequisites: `ansible-core` (e.g. `pipx install ansible-core`) and a completed `terraform apply`
so `inventory.ini` / `ssh_key.pem` exist here.

```sh
cd infra/ansible

# Sanity-check connectivity
ansible -i inventory.ini bytebite -m ping

# Supply secrets/runtime vars, then deploy
cp deploy-vars.example.yml deploy-vars.yml   # edit: set openai_api_key (+ ghcr creds if private)
ansible-playbook site.yml -e @deploy-vars.yml
```

When you bring your own SSH key in Terraform (`ssh_public_key` set), no `ssh_key.pem` is written —
add `ansible_ssh_private_key_file=/path/to/key` to the inventory or pass `--private-key`.

## Variables

Defaults live in `group_vars/bytebite.yml`; override per-run with `-e` / `-e @deploy-vars.yml`.

| Var | Default | Notes |
|-----|---------|-------|
| `openai_api_key` | — (**required**) | No default on purpose; the `.env` render fails fast without it |
| `image_tag` | `latest` | Or a commit SHA |
| `registry` | `ghcr.io/aet-devops26/team-bytebite` | Matches `compose.yaml` |
| `ghcr_username` / `ghcr_token` | `""` | GHCR login is skipped when the token is empty |
| `app_dir` | `/opt/bytebite` | Where compose.yaml + .env land on the VM |

After a deploy, the app is at `http://<public_ip>:8081`.
