# terraform/variables.tf

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 Instance Type"
  type        = string
  default     = "t2.micro"
}

variable "ami_id" {
  description = "Ubuntu AMI ID"
  type        = string
  default     = "ami-03f4878755434977f"
}

variable "app_port" {
  description = "Node.js Application Port"
  type        = number
  default     = 3000
}

variable "alb_port" {
  description = "Application Load Balancer Port"
  type        = number
  default     = 80
}

variable "key_name" {
  description = "AWS EC2 Key Pair Name"
  type        = string
  default     = "node-key"
}

variable "project_name" {
  description = "Project Name"
  type        = string
  default     = "nodejs-app"
}

variable "health_check_path" {
  description = "Load Balancer Health Check Path"
  type        = string
  default     = "/"
}