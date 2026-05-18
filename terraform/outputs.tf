output "instance_name" {
  description = "Name of the Compute Engine VM"
  value       = google_compute_instance.nodejs_vm.name
}

output "instance_id" {
  description = "ID of the Compute Engine VM"
  value       = google_compute_instance.nodejs_vm.instance_id
}

output "instance_zone" {
  description = "Zone where VM is deployed"
  value       = google_compute_instance.nodejs_vm.zone
}

output "instance_internal_ip" {
  description = "Internal IP of the VM"
  value       = google_compute_instance.nodejs_vm.network_interface[0].network_ip
}

output "instance_external_ip" {
  description = "External IP of the VM"
  value       = google_compute_instance.nodejs_vm.network_interface[0].access_config[0].nat_ip
}

output "load_balancer_ip" {
  description = "External IP address of the GCP HTTP load balancer"
  value       = google_compute_global_address.lb_ip.address
}

output "load_balancer_url" {
  description = "External URL for the HTTP load balancer"
  value       = "http://${google_compute_global_address.lb_ip.address}"
}