# terraform/main.tf

# ==============================
# Provider
# ==============================

provider "aws" {
  region = var.aws_region
}

# ==============================
# Default VPC & Subnets
# ==============================

resource "aws_default_vpc" "default" {}

resource "aws_default_subnet" "subnet_a" {
  availability_zone = "${var.aws_region}a"
}

resource "aws_default_subnet" "subnet_b" {
  availability_zone = "${var.aws_region}b"
}

# ==============================
# Security Group
# ==============================

resource "aws_security_group" "node_sg" {
  name_prefix = "node-sg-cdf"

  # Node.js App Port
  ingress {
    description = "Node.js App Port"
    from_port   = var.app_port
    to_port     = var.app_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Load Balancer HTTP Port
  ingress {
    description = "HTTP Access"
    from_port   = var.alb_port
    to_port     = var.alb_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH Access
  ingress {
    description = "SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"

    # Replace with your IP for security
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Traffic
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
    Name = "${var.project_name}-sg"
  }
}

# ==============================
# EC2 Instance
# ==============================

resource "aws_instance" "node_server" {
  count = 2

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
    Name = "${var.project_name}-server-${count.index + 1}"
  }
}

# ==============================
# Application Load Balancer
# ==============================

resource "aws_lb" "app_lb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [
    aws_security_group.node_sg.id
  ]

  subnets = [
    aws_default_subnet.subnet_a.id,
    aws_default_subnet.subnet_b.id
  ]

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# ==============================
# Target Group
# ==============================

resource "aws_lb_target_group" "app_tg" {
  name     = "${var.project_name}-tg"
  port     = var.app_port
  protocol = "HTTP"

  vpc_id = aws_default_vpc.default.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    timeout             = 5
    path                = var.health_check_path
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-tg"
  }
}

# ==============================
# Attach EC2 To Target Group
# ==============================

resource "aws_lb_target_group_attachment" "app_attach" {
  count = 2
  target_group_arn = aws_lb_target_group.app_tg.arn
  target_id        = aws_instance.node_server[count.index].id
  port             = var.app_port
}

# ==============================
# ALB Listener
# ==============================

resource "aws_lb_listener" "app_listener" {
  load_balancer_arn = aws_lb.app_lb.arn
  port              = var.alb_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}