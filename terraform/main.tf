# ==============================
# Provider
# ==============================

provider "aws" {
  region = var.aws_region
}

# ==============================
# Variables
# ==============================

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-south-1"
}

variable "ami_id" {
  description = "Amazon Linux 2 AMI"
  type        = string
  default     = "ami-0f58b397bc5c1f2e8"
}

variable "instance_type" {
  description = "EC2 Instance Type"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "AWS EC2 Key Pair Name"
  type        = string
}

# ==============================
# Security Group
# ==============================

resource "aws_security_group" "node_sg" {
  name_prefix = "node-sg-abc-"

  ingress {
    description = "Node.js App Port"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"

    # Replace with your IP for better security
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow All Outbound Traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "node-security-group"
  }
}

# ==============================
# EC2 Instance
# ==============================

resource "aws_instance" "node_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.node_sg.id]

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = {
    Name = "github-actions-node"
  }
}

# ==============================
# Outputs
# ==============================

output "server_ip" {
  description = "Public IP of EC2"
  value       = aws_instance.node_server.public_ip
}

output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.node_server.id
}