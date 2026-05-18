# -------------------------
# Load Balancer IP
# -------------------------
output "load_balancer_ip" {
  description = "External IP of the HTTP Load Balancer"
  value       = google_compute_global_address.lb_ip.address
}

# -------------------------
# Load Balancer URL
# -------------------------
output "load_balancer_url" {
  description = "Public URL of the application"
  value       = "http://${google_compute_global_address.lb_ip.address}"
}

# -------------------------
# Instance Group Manager
# -------------------------
output "instance_group_manager" {
  description = "Managed Instance Group name"
  value       = google_compute_instance_group_manager.nodejs_mig.name
}

# -------------------------
# Instance Template
# -------------------------
output "instance_template" {
  description = "Instance template used by MIG"
  value       = google_compute_instance_template.nodejs_template.name
}