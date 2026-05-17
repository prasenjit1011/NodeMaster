resource "random_id" "vm_suffix" {
  byte_length = 3
}

resource "google_compute_instance" "nodejs_vm" {
  name         = "${var.vm_name}-${random_id.vm_suffix.hex}"
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.image
      size  = var.boot_disk_size
    }
  }

  network_interface {
    network = var.network_name

    access_config {}
  }

  metadata_startup_script = file("${path.module}/startup.sh")

  tags = ["nodejs"]

  allow_stopping_for_update = true
}

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