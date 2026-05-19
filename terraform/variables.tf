# -----------------------------
# GCP Project Configuration
# -----------------------------

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "us-central1-a"
}

# -----------------------------
# VM Configuration
# -----------------------------

variable "vm_name" {
  description = "Name of Compute Engine VM"
  type        = string
  default     = "nodejs-vm"
}

variable "machine_type" {
  description = "GCP VM machine type"
  type        = string
  default     = "e2-micro"
}

variable "image" {
  description = "Boot disk image"
  type        = string
  default     = "debian-cloud/debian-12"
}

variable "boot_disk_size" {
  description = "Boot disk size in GB"
  type        = number
  default     = 10
}

# -----------------------------
# GitHub Repository (optional)
# -----------------------------

variable "github_repo" {
  description = "GitHub repository URL (optional)"
  type        = string
  default     = "https://github.com/prasenjit1011/NodeMaster.git"
}

variable "github_branch" {
  description = "GitHub repository branch to deploy"
  type        = string
  default     = "typescript_main_teraform_gcp"
}

variable "instance_count" {
  description = "Number of VMs to deploy in the managed instance group"
  type        = number
  default     = 2
}

# -----------------------------
# Network Configuration
# -----------------------------

variable "network_name" {
  description = "VPC network name"
  type        = string
  default     = "default"
}

# -----------------------------
# Firewall Configuration
# -----------------------------

variable "firewall_name" {
  description = "Firewall resource name"
  type        = string
  default     = "nodejs-allow-http"
}

variable "allowed_ports" {
  description = "Firewall allowed ports"
  type        = list(number)
  default     = [22, 80, 443, 3000]
}

variable "lb_port" {
  description = "Load balancer listening port"
  type        = number
  default     = 80
}

# -----------------------------
# Labels (BEST PRACTICE)
# -----------------------------

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default = {
    env  = "dev"
    app  = "nodejs"
  }
}

variable "mongo_uri" {
  type      = string
  sensitive = true
}