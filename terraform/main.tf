# ==============================
# Provider
# ==============================

provider "aws" {
  region = var.aws_region
}

# ==============================
# Security Group
# ==============================

resource "aws_security_group" "node_sg" {
  name_prefix = "node-sg-abc-"

  ingress {
    description = "Node.js App Port"
    from_port   = var.app_port
    to_port     = var.app_port
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

# outputs are defined in outputs.tf