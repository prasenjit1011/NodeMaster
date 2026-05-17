terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# -----------------------------
# Provider (GitHub Actions friendly - NO file() usage)
# -----------------------------
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# -----------------------------
# Random suffix (prevents duplicate VM name conflicts)
# -----------------------------
resource "random_id" "vm_suffix" {
  byte_length = 3
}

# -----------------------------
# Compute Engine VM
# -----------------------------
resource "google_compute_instance" "nodejs_vm" {
  name         = "${var.vm_name}-${random_id.vm_suffix.hex}"
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["nodejs"]

  boot_disk {
    initialize_params {
      image = var.image
      size  = var.boot_disk_size
    }
  }

  network_interface {
    network = var.network_name

    access_config {
      # Ephemeral external IP
    }
  }

  metadata_startup_script = file("${path.module}/startup.sh")

  # Helps safe updates in CI/CD
  allow_stopping_for_update = true

  labels = var.labels
}

# -----------------------------
# Firewall Rule (HTTP + App ports)
# -----------------------------
resource "google_compute_firewall" "allow_http" {
  name    = "nodejs-allow-http"
  network = var.network_name

  allow {
    protocol = "tcp"
    ports    = var.allowed_ports
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["nodejs"]
}