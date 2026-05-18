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

  metadata = {
    MONGO_URI = var.mongo_uri
  }

  metadata_startup_script = file("${path.module}/startup.sh")

  tags = ["nodejs"]

  allow_stopping_for_update = true
}

resource "google_compute_firewall" "allow_http" {
  name    = "${var.project_id}-allow-http"
  network = var.network_name

  allow {
    protocol = "tcp"
    ports    = var.allowed_ports
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["nodejs"]
}

resource "google_compute_instance_group" "nodejs_group" {
  name    = "${var.vm_name}-group"
  zone    = var.zone
  network = var.network_name

  instances = [google_compute_instance.nodejs_vm.self_link]

  named_port {
    name = "http"
    port = var.lb_port
  }
}

resource "google_compute_health_check" "http" {
  name                = "${var.project_id}-http-health-check"
  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 2

  http_health_check {
    request_path = "/"
    port         = var.lb_port
  }
}

resource "google_compute_backend_service" "nodejs_backend" {
  name                  = "${var.project_id}-backend-service"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 10
  health_checks         = [google_compute_health_check.http.self_link]
  load_balancing_scheme = "EXTERNAL"

  backend {
    group = google_compute_instance_group.nodejs_group.self_link
  }
}

resource "google_compute_url_map" "nodejs_url_map" {
  name            = "${var.project_id}-url-map"
  default_service = google_compute_backend_service.nodejs_backend.self_link
}

resource "google_compute_target_http_proxy" "nodejs_proxy" {
  name    = "${var.project_id}-http-proxy"
  url_map = google_compute_url_map.nodejs_url_map.self_link
resource "google_compute_global_address" "lb_ip" {
  name = "${var.project_id}-lb-ip"
}

resource "google_compute_global_forwarding_rule" "http" {
  name                  = "${var.project_id}-http-forwarding-rule"
  target                = google_compute_target_http_proxy.nodejs_proxy.self_link
  port_range            = "${var.lb_port}"
  load_balancing_scheme = "EXTERNAL"
  ip_protocol           = "TCP"
  ip_address            = google_compute_global_address.lb_ip.address
}