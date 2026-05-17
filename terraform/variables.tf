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
  default     = "asia-south1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "asia-south1-a"
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
# GitHub Repository
# -----------------------------
variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
}

# -----------------------------
# Network Configuration
# -----------------------------
variable "network_name" {
  description = "VPC network name"
  type        = string
  default     = "default"
}

variable "subnetwork_name" {
  description = "Subnetwork name"
  type        = string
  default     = "default"
}

# -----------------------------
# Firewall Configuration
# -----------------------------
variable "allowed_ports" {
  description = "List of allowed firewall ports"
  type        = list(string)

  default = [
    "22",
    "80",
    "443",
    "3000"
  ]
}

# -----------------------------
# Auto Destroy Configuration
# -----------------------------
variable "enable_auto_delete" {
  description = "Enable VM auto deletion"
  type        = bool
  default     = false
}

variable "auto_destroy_hours" {
  description = "Hours before infrastructure destroy"
  type        = number
  default     = 1
}