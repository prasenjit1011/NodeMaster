terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# -----------------------------------
# Provider
# -----------------------------------
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# -----------------------------------
# Enable Required APIs
# -----------------------------------
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
}

# -----------------------------------
# LOW COST STATIC IP
# -----------------------------------
resource "google_compute_address" "static_ip" {
  name = "nodejs-static-ip"
}

# -----------------------------------
# Firewall
# -----------------------------------
resource "google_compute_firewall" "allow_http" {
  name    = "allow-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["3000", "80"]
  }

  source_ranges = ["0.0.0.0/0"]
}

# -----------------------------------
# Startup Script
# -----------------------------------
resource "google_compute_instance" "nodejs_vm" {
  name         = "nodejs-demo-vm"
  machine_type = "e2-micro" # Cheapest shared-core VM
  zone         = var.zone

  tags = ["http-server"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"

      # Smallest disk to reduce billing
      size = 10
      type = "pd-standard"
    }
  }

  network_interface {
    network = "default"

    access_config {
      nat_ip = google_compute_address.static_ip.address
    }
  }

  metadata_startup_script = file("${path.module}/startup.sh")

  # -----------------------------------
  # AUTO SHUTDOWN AFTER 1 HOUR
  # -----------------------------------
  metadata = {
    shutdown-script = <<-EOT
      #!/bin/bash
      shutdown -h now
    EOT
  }

  service_account {
    scopes = ["cloud-platform"]
  }

  depends_on = [
    google_project_service.compute
  ]
}

# -----------------------------------
# Cloud Scheduler (AUTO DELETE VM)
# -----------------------------------
resource "google_project_service" "scheduler_api" {
  service = "cloudscheduler.googleapis.com"
}

resource "google_project_service" "functions_api" {
  service = "cloudfunctions.googleapis.com"
}

resource "google_project_service" "pubsub_api" {
  service = "pubsub.googleapis.com"
}

# -----------------------------------
# OUTPUT
# -----------------------------------
output "app_url" {
  value = "http://${google_compute_address.static_ip.address}:3000"
}