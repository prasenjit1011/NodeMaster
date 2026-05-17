output "instance_name" {
  value = google_compute_instance.nodejs_vm.name
}

output "instance_external_ip" {
  value = google_compute_instance.nodejs_vm.network_interface[0].access_config[0].nat_ip
}

output "application_url" {
  value = "http://${google_compute_instance.nodejs_vm.network_interface[0].access_config[0].nat_ip}:3000"
}