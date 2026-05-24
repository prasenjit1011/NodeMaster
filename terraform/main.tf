module "eks" {
  source  = "terraform-aws-modules/eks/aws"

  cluster_name    = "node-cluster"
  cluster_version = "1.33"

  subnet_ids = []
  vpc_id     = ""

  eks_managed_node_groups = {
    default = {
      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 2
      desired_size = 2
    }
  }
}