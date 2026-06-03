# Terraform — ByteBite Azure VM

Provisions the Azure VM (and its networking) that
[`.github/workflows/deploy-azure.yml`](../../.github/workflows/deploy-azure.yml) deploys onto via
SSH + Docker Compose. Before this, the VM was created by hand; now it is reproducible.

This is **infrastructure only** — it provisions a bare, reachable VM. Configuration (installing
Docker, deploying the app) is handled by **Ansible** in the next step; Terraform only does enough to
let Ansible connect. cloud-init is therefore minimal (it just ensures Python 3 is present).

## What it creates

- Resource group, virtual network + subnet
- Network security group with inbound rules for `22` (SSH), `8081` (client), `8080` (api-gateway),
  `8000` (gen-ai) — matching the ports `compose.yaml` publishes
- Static public IP, network interface
- Ubuntu 22.04 LTS VM (`Standard_B2s` by default)
- An SSH keypair (generated unless you supply `ssh_public_key`)
- **For Ansible:** a static inventory and the SSH private key, written to the sibling
  `../ansible/` folder (`inventory.ini`, `ssh_key.pem`) on `apply`. Both are gitignored.

State is stored **locally** (`terraform.tfstate`), gitignored. For a shared team setup, configure an
`azurerm` backend in `versions.tf`.

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

## Wire the outputs into GitHub

After `apply`, set these in the repo's GitHub settings (the values the deploy workflow already
reads). `OPENAI_API_KEY` stays a secret as before.

| Terraform output | GitHub setting | Type |
|---|---|---|
| `public_ip` | `AZURE_PUBLIC_IP` | Variable |
| `admin_username` | `AZURE_USER` | Variable |
| `ssh_private_key` | `AZURE_PRIVATE_KEY` | Secret |

Get the values:

```sh
terraform output public_ip
terraform output admin_username
terraform output -raw ssh_private_key    # sensitive
```

Then trigger `deploy-azure.yml` (workflow_dispatch) and open `http://<public_ip>:8081`.

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

- **Tightening ingress:** only `8081` (the client) needs to be public. You can remove the `8080` and
  `8000` rules from `local.inbound_ports` in `main.tf` if you don't need to reach the api-gateway or
  gen-ai service directly.
- **SSH in manually:**
  ```sh
  terraform output -raw ssh_private_key > id_bytebite && chmod 600 id_bytebite
  ssh -i id_bytebite "$(terraform output -raw admin_username)@$(terraform output -raw public_ip)"
  ```
