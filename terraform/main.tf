resource "google_compute_instance" "nodejs_vm" {
  name         = var.vm_name
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.image
      size  = var.boot_disk_size
    }
  }

  network_interface {
    network = "default"

    access_config {
      // public IP
    }
  }

  metadata_startup_script = file("${path.module}/startup.sh")

  tags = ["nodejs-vm"]
}

resource "google_compute_firewall" "allow_http" {
  name    = "${var.vm_name}-allow-http"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80", "3000"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["nodejs-vm"]
}