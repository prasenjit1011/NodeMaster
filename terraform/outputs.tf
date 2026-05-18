output "load_balancer_ip" {
  description = "External IP of Load Balancer"
  value       = google_compute_global_address.lb_ip.address
}

output "load_balancer_url" {
  description = "HTTP URL of Load Balancer"
  value       = "http://${google_compute_global_address.lb_ip.address}"
}

output "instance_group_name" {
  description = "Managed Instance Group name"
  value       = google_compute_instance_group_manager.nodejs_mig.name
}

output "instance_template" {
  description = "Instance template used by MIG"
  value       = google_compute_instance_template.nodejs_template.name
}