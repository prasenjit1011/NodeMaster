output "server_ip" {
  value = aws_instance.node_server.public_ip
}

output "instance_id" {
  value = aws_instance.node_server.id
}