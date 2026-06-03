# Auth comes from the Azure CLI: run `az login` and `az account set --subscription <id>`
# before plan/apply. No credentials are stored in this repo.
provider "azurerm" {
  features {}
}

provider "tls" {}
