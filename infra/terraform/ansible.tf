# Hand-off to Ansible: Terraform provisions the VM, then writes the artifacts the
# Ansible step needs — a static inventory and (when Terraform generated the key) the
# private key on disk. Both land in the sibling ../ansible/ folder and are gitignored.

locals {
  ansible_dir = "${path.module}/../ansible"

  # Absolute path so `ansible-playbook` resolves the key regardless of its cwd.
  # Empty when the user supplied their own key (they manage its path themselves).
  ssh_key_file_path = var.ssh_public_key == "" ? abspath("${local.ansible_dir}/ssh_key.pem") : ""
}

# Private key on disk for Ansible (only when Terraform generated the keypair).
resource "local_sensitive_file" "ssh_key" {
  count           = var.ssh_public_key == "" ? 1 : 0
  filename        = "${local.ansible_dir}/ssh_key.pem"
  content         = tls_private_key.vm[0].private_key_pem
  file_permission = "0600"
}

# Static inventory pointed at the freshly provisioned VM.
resource "local_file" "ansible_inventory" {
  filename = "${local.ansible_dir}/inventory.ini"
  content = templatefile("${path.module}/templates/inventory.tmpl", {
    public_ip      = azurerm_public_ip.main.ip_address
    admin_username = var.admin_username
    key_file       = local.ssh_key_file_path
  })
}
