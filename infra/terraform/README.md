# Terraform — ByteBite Azure VM

Provisions the Azure VM (and its networking) that
[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) then configures with Ansible.
Before this, the VM was created by hand; now it is reproducible.

This is **infrastructure only** — it provisions a bare, reachable VM. Configuration (installing
Docker, deploying the app) is handled by **Ansible** in the next step; Terraform only does enough to
let Ansible connect. cloud-init is therefore minimal (it just ensures Python 3 is present).

## What it creates

- Resource group, virtual network + subnet
- Network security group with inbound rules for `22` (SSH), `8081` (client), `8080` (api-gateway)
  — matching the ports `compose.yaml` publishes (gen-ai and the DBs are internal)
- Static public IP, network interface
- Ubuntu 22.04 LTS VM (`Standard_D2_v3` by default)
- An SSH keypair (generated unless you supply `ssh_public_key`)
- **For Ansible:** a static inventory and the SSH private key, written to the sibling
  `../ansible/` folder (`inventory.ini`, `ssh_key.pem`) on `apply`. Both are gitignored.

State is stored **remotely** in Azure Storage (`azurerm` backend in `versions.tf`:
`teamstatebytebite` / `tfstate` container), so CI and team members share one locked state.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli), logged in:
  ```sh
  az login
  az account set --subscription <SUBSCRIPTION_ID>
  ```

## Usage

```sh
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit as needed
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

Tear down when finished:

```sh
terraform destroy
```

## CI/CD

[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) does the whole thing in one job:
`terraform apply` provisions/updates the VM, then Ansible deploys onto it. `apply` is idempotent, so
when the infra is unchanged it's a no-op and only the Ansible deploy does work. It runs after a green
image build of `main`, and on demand (`workflow_dispatch`).

Because both steps run on the same runner, Terraform's generated inventory + SSH key flow straight to
Ansible — nothing is copied into repo settings. Just **two GitHub secrets**:

| Secret | What |
|---|---|
| `AZURE_CREDENTIALS` | Service-principal JSON for `azure/login` (and the Terraform backend) |
| `LOGOS_KEY` | Passed through to the `gen-ai` service as the default LLM provider key |
| `OPENAI_API_KEY` | Optional key for the frontend's OpenAI provider switch |

Create the service principal once (Contributor lets it manage resources **and** read the state
storage account's keys):

```sh
az ad sp create-for-rbac \
  --name bytebite-cicd \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID> \
  --sdk-auth
```

Paste the whole JSON blob it prints into the `AZURE_CREDENTIALS` repo secret. Done.

## Hand-off to Ansible

`apply` writes a ready-to-use inventory into the sibling `../ansible/` folder:

```sh
terraform output ansible_inventory_path   # ../ansible/inventory.ini
```

The inventory references `../ansible/ssh_key.pem` (absolute path) when Terraform generated the key,
so the Ansible step can target the VM directly from `infra/ansible/`, e.g.:

```sh
ansible -i inventory.ini bytebite -m ping
```

If you supplied your own `ssh_public_key`, no key file is written — add
`ansible_ssh_private_key_file` to your inventory/config pointing at your own key.

## Notes

- **Tightening ingress:** only `8081` (the client) strictly needs to be public. You can remove the
  `8080` (api-gateway) rule from `local.inbound_ports` in `main.tf` if you don't need to reach the
  gateway directly (the client proxies `/api/` to it over the internal Compose network).
- **SSH in manually:**
  ```sh
  terraform output -raw ssh_private_key > id_bytebite && chmod 600 id_bytebite
  ssh -i id_bytebite "$(terraform output -raw admin_username)@$(terraform output -raw public_ip)"
  ```
