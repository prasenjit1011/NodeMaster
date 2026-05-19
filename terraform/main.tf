# -------------------------
# VPC Network
# -------------------------
resource "google_compute_network" "vpc" {
  name                    = "${var.project_id}-vpc"
  auto_create_subnetworks = true
}

# -------------------------
# Firewall Rule
# -------------------------
resource "google_compute_firewall" "allow_http" {
  name    = "${var.project_id}-allow-http"
  network = google_compute_network.vpc.self_link

  allow {
    protocol = "tcp"
    ports    = var.allowed_ports
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["nodejs"]
}

# -------------------------
# Instance Template (FIXED)
# -------------------------
resource "google_compute_instance_template" "nodejs_template" {
  name         = "${var.vm_name}-template"
  machine_type = var.machine_type

  disk {
    boot         = true
    auto_delete  = true
    source_image = var.image
  }

  network_interface {
    network = google_compute_network.vpc.self_link
    access_config {}
  }

  metadata = {
    MONGO_URI   = var.mongo_uri
    NODE_ENV    = "production"
    REGION      = var.region
    PROJECT_ID  = var.project_id
  }

  metadata_startup_script = file("${path.module}/startup.sh")

  tags = ["nodejs"]
}

# -------------------------
# Managed Instance Group
# -------------------------
resource "google_compute_instance_group_manager" "nodejs_mig" {
  name               = "${var.vm_name}-mig"
  base_instance_name = "nodejs"
  zone               = var.zone

  version {
    instance_template = google_compute_instance_template.nodejs_template.self_link
  }

  target_size = 2
  named_port {
    name = "http"
    port = 3000
  }
}

# -------------------------
# Health Check
# -------------------------
# var.lb_port
resource "google_compute_health_check" "http" {
  name                = "${var.project_id}-health-check"
  check_interval_sec  = 10
  timeout_sec         = 5
  healthy_threshold   = 2
  unhealthy_threshold = 2

  http_health_check {
    request_path = "/"
    port         = 3000
  }
}

# -------------------------
# Backend Service
# -------------------------
resource "google_compute_backend_service" "nodejs_backend" {
  name                  = "${var.project_id}-backend"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 10
  load_balancing_scheme = "EXTERNAL"

  health_checks = [google_compute_health_check.http.self_link]

  backend {
    group = google_compute_instance_group_manager.nodejs_mig.instance_group
  }
}

# -------------------------
# URL Map
# -------------------------
resource "google_compute_url_map" "nodejs_url_map" {
  name            = "${var.project_id}-url-map"
  default_service = google_compute_backend_service.nodejs_backend.self_link
}

# -------------------------
# HTTP Proxy
# -------------------------
resource "google_compute_target_http_proxy" "nodejs_proxy" {
  name    = "${var.project_id}-http-proxy"
  url_map = google_compute_url_map.nodejs_url_map.self_link
}

# -------------------------
# Global IP
# -------------------------
resource "google_compute_global_address" "lb_ip" {
  name = "${var.project_id}-lb-ip"
}

# -------------------------
# Forwarding Rule
# -------------------------
resource "google_compute_global_forwarding_rule" "http" {
  name                  = "${var.project_id}-http-forwarding-rule"
  target                = google_compute_target_http_proxy.nodejs_proxy.self_link
  port_range            = var.lb_port
  load_balancing_scheme = "EXTERNAL"
  ip_protocol           = "TCP"
  ip_address            = google_compute_global_address.lb_ip.address
}