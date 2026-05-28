resource "aws_lambda_function" "app" {
  function_name = "nodemaster"

  package_type = "Image"

  image_uri = "${aws_ecr_repository.repo.repository_url}:latest"

  role = aws_iam_role.lambda_role.arn

  timeout = 30
  memory_size = 512
}

resource "aws_ecr_repository" "repo" {
  name = "nodemaster"
}