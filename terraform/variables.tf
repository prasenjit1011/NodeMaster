# terraform/variables.tf

variable "aws_region" {
  default = "ap-south-1"
}

variable "instance_type" {
  default = "t2.micro"
}

variable "ami_id" {
  default = "ami-03f4878755434977f"
}

variable "app_port" {
  default = 3000
}

variable "key_name" {
  description = "AWS EC2 Key Pair Name"
  type        = string
}