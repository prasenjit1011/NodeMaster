resource "aws_ecr_repository" "app" {
  name = "nodejs-k8s-app"

  force_delete = true
}