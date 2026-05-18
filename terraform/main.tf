# -----------------------------
# 1. Load Balancer (Top Section)
# -----------------------------

resource "google_compute_global_address" "lb_ip" {
  name = "lb-ip"
}

resource "google_compute_backend_service" "backend" {
  name                  = "nodejs-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL"
  port_name             = "http"
  timeout_sec           = 30

  backend {
    group = google_compute_instance_group_manager.app_group.instance_group
  }
}

resource "google_compute_url_map" "url_map" {
  name            = "url-map"
  default_service = google_compute_backend_service.backend.self_link
}

resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "http-proxy"
  url_map = google_compute_url_map.url_map.self_link
}

resource "google_compute_global_forwarding_rule" "forwarding_rule" {
  name       = "http-forwarding-rule"
  target     = google_compute_target_http_proxy.http_proxy.self_link
  port_range = "80"
  ip_address = google_compute_global_address.lb_ip.address
}

# -----------------------------
# 2. VM / Instance Group (Bottom Section)
# -----------------------------

resource "google_compute_instance_template" "app_template" {
  name         = "app-template"
  machine_type = "e2-medium"

  disk {
    boot = true
    source_image = "debian-cloud/debian-12"
  }

  network_interface {
    network = "default"
    access_config {}
  }
}

resource "google_compute_instance_group_manager" "app_group" {
  name               = "app-group"
  base_instance_name = "app"
  zone               = "us-central1-a"

  version {
    instance_template = google_compute_instance_template.app_template.id
  }
}