terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

variable "project_name" {
  type    = string
  default = "nodemaster"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "notification_email" {
  type    = string
  default = ""
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/../dist/handler.js"
  output_path = "${path.module}/build/function.zip"
}

# Topic kept for optional email alerts only. OTP SMS is sent directly to PhoneNumber.
resource "aws_sns_topic" "notifications" {
  name = "${var.project_name}-notifications"
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_sns" {
  statement {
    sid       = "PublishSmsAndTopic"
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = ["*"]
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.project_name}-notify-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy" "lambda_sns" {
  name   = "sns-publish"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_sns.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-notify"
  retention_in_days = 7
}

resource "aws_lambda_function" "notify" {
  function_name    = "${var.project_name}-notify"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda.arn
  timeout          = 10
  memory_size      = 128

  environment {
    variables = {
      SMS_TYPE = "Transactional"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_logs,
  ]
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.project_name}-notify-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.notify.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "otp" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /otp"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "notify" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /notify"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/apigateway/${var.project_name}-notify"
  retention_in_days = 7
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId   = "$context.requestId"
      status      = "$context.status"
      integration = "$context.integrationErrorMessage"
      routeKey    = "$context.routeKey"
    })
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notify.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

output "api_endpoint" {
  value = "${aws_apigatewayv2_api.http.api_endpoint}/otp"
}

output "sns_topic_arn" {
  value = aws_sns_topic.notifications.arn
}

output "lambda_function_name" {
  value = aws_lambda_function.notify.function_name
}
