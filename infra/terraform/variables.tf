variable "prefix" {
  description = "Name prefix applied to all created resources"
  type        = string
  default     = "bytebite"
}

variable "location" {
  description = "Azure region to deploy into"
  type        = string
  default     = "polandcentral"
}

variable "vm_size" {
  description = "VM size"
  type        = string
  default     = "Standard_D2_v3"
}

variable "admin_username" {
  description = "Admin/SSH username on the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = <<-EOT
    Optional. An existing SSH public key (OpenSSH format) to authorize on the VM.
    Leave empty to have Terraform generate a keypair; the private key is then
    available via the `ssh_private_key` output.
  EOT
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default = {
    project   = "bytebite"
    managedby = "terraform"
  }
}
