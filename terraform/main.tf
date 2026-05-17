resource "google_project_service" "compute" {
  project = var.project_id
  service = "compute.googleapis.com"

  disable_on_destroy = true
}

resource "google_compute_firewall" "allow_http" {
  name    = "nodejs-allow-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["3000"]
  }

  source_ranges = ["0.0.0.0/0"]

  target_tags = ["http-server"]
}

resource "google_compute_instance" "nodejs_vm" {
  name         = var.vm_name
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["http-server"]

  boot_disk {
    initialize_params {
      image = var.image
      size  = var.boot_disk_size
    }
  }

  network_interface {
    network = "default"

    access_config {}
  }

  metadata_startup_script = file("${path.module}/startup.sh")

  service_account {
    scopes = ["cloud-platform"]
  }

  depends_on = [
    google_project_service.compute
  ]
}