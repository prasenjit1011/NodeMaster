module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"

  name = "node-vpc"

  cidr = "10.0.0.0/16"

  azs             = ["ap-south-1a", "ap-south-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = false
  enable_dns_hostnames = true
  enable_dns_support   = true
  map_public_ip_on_launch = true

  public_subnet_tags = {
    "kubernetes.io/cluster/node-cluster" = "shared"
    "kubernetes.io/role/elb"             = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/node-cluster" = "shared"
    "kubernetes.io/role/internal-elb"    = "1"
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.22.0"

  name               = "node-cluster"
  kubernetes_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets

  endpoint_public_access  = true
  endpoint_private_access = false

  eks_managed_node_groups = {
    default = {

      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["t3.medium"]

      subnet_ids = module.vpc.public_subnets

      min_size     = 1
      max_size     = 1
      desired_size = 1

      timeouts = {
        create = "45m"
        delete = "45m"
      }
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