output "public_ip" {
  description = "Public IP of the VM. The app is served at http://<public_ip>:8081 and Grafana at http://<public_ip>:3000."
  value       = azurerm_public_ip.main.ip_address
}

output "resource_group_name" {
  description = "Resource group holding the VM. Used by CI to start the VM if it was deallocated to save cost."
  value       = azurerm_resource_group.main.name
}

output "vm_name" {
  description = "Name of the VM. Used by CI to start the VM if it was deallocated to save cost."
  value       = azurerm_linux_virtual_machine.main.name
}

output "admin_username" {
  description = "SSH/admin username on the VM."
  value       = var.admin_username
}

output "ansible_inventory_path" {
  description = "Path to the generated Ansible inventory for the next (configuration) step."
  value       = local_file.ansible_inventory.filename
}

output "ssh_private_key" {
  description = <<-EOT
    PEM private key for SSH, when Terraform generated the keypair (ssh_public_key was empty).
    CI uses the copy apply writes to ../ansible/ssh_key.pem; for a manual SSH, retrieve with:
      terraform output -raw ssh_private_key
    Empty if you supplied your own ssh_public_key.
  EOT
  value       = var.ssh_public_key == "" ? tls_private_key.vm[0].private_key_pem : null
  sensitive   = true
}
