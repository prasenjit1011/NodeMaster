module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"

  name = "node-vpc"

  cidr = "10.0.0.0/16"

  public_subnet_assign_ipv6_address_on_creation = false
  map_public_ip_on_launch = true

  azs             = ["ap-south-1a", "ap-south-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = false
  single_nat_gateway = false

  enable_dns_hostnames = true
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.22.0"

  name               = "node-cluster"
  kubernetes_version = "1.30"

  vpc_id     = module.vpc.vpc_id

  # USE PUBLIC SUBNETS
  subnet_ids = module.vpc.public_subnets

  endpoint_public_access = true
  endpoint_private_access = true

  eks_managed_node_groups = {
    default = {
      instance_types = ["t3.micro"]

      subnet_ids = module.vpc.public_subnets

      min_size     = 1
      max_size     = 1
      desired_size = 1
    }
  }
}

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.42"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}