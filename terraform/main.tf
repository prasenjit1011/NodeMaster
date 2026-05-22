provider "aws" {
  region = "ap-south-1"
}

resource "aws_security_group" "node_sg" {
  name = "node-sg"

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "node_server" {
  ami           = "ami-03f4878755434977f"
  instance_type = "t2.micro"

  security_groups = [aws_security_group.node_sg.name]


  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
              yum install -y nodejs git

              mkdir -p /home/ec2-user/app
              cd /home/ec2-user/app

              cat > server.js <<'EOL'
              const express = require("express");
              const app = express();

              app.get("/", (req, res) => {
                res.send("Hello from GitHub Actions");
              });

              app.listen(3000, () => {
                console.log("Running");
              });
              EOL

              npm init -y
              npm install express

              nohup node server.js > app.log 2>&1 &
              EOF

  tags = {
    Name = "github-actions-node"
  }
}