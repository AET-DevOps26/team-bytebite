output "public_ip" {
  description = "Public IP of the VM. Set this as the AZURE_PUBLIC_IP GitHub variable."
  value       = azurerm_public_ip.main.ip_address
}

output "admin_username" {
  description = "SSH/admin username. Set this as the AZURE_USER GitHub variable."
  value       = var.admin_username
}

output "ansible_inventory_path" {
  description = "Path to the generated Ansible inventory for the next (configuration) step."
  value       = local_file.ansible_inventory.filename
}

output "ssh_private_key" {
  description = <<-EOT
    PEM private key for SSH, when Terraform generated the keypair (ssh_public_key was empty).
    Set this as the AZURE_PRIVATE_KEY GitHub secret. Retrieve with:
      terraform output -raw ssh_private_key
    Empty if you supplied your own ssh_public_key.
  EOT
  value       = var.ssh_public_key == "" ? tls_private_key.vm[0].private_key_pem : null
  sensitive   = true
}
