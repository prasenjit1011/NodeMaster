# terraform/outputs.tf

output "server_ip" {
  description = "EC2 Public IP Address"
  value       = aws_instance.node_server.public_ip
}

output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.node_server.id
}

output "load_balancer_dns" {
  description = "Application Load Balancer DNS Name"
  value       = aws_lb.app_lb.dns_name
}

output "load_balancer_arn" {
  description = "Application Load Balancer ARN"
  value       = aws_lb.app_lb.arn
}

output "target_group_arn" {
  description = "ALB Target Group ARN"
  value       = aws_lb_target_group.app_tg.arn
}