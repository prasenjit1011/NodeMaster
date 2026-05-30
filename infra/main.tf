terraform {
  required_version = ">= 1.5.0"

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

provider "aws" {
  region = var.aws_region
}

# ==========================================
# ZIP LAMBDAS
# ==========================================

data "archive_file" "validate_zip" {
  type        = "zip"
  source_dir  = "../lambdas/validate"
  output_path = "../lambdas/validate.zip"
}

data "archive_file" "dblookup_zip" {
  type        = "zip"
  source_dir  = "../lambdas/dbLookup"
  output_path = "../lambdas/dbLookup.zip"
}

data "archive_file" "fallback_zip" {
  type        = "zip"
  source_dir  = "../lambdas/fallback"
  output_path = "../lambdas/fallback.zip"
}

data "archive_file" "store_zip" {
  type        = "zip"
  source_dir  = "../lambdas/store"
  output_path = "../lambdas/store.zip"
}

data "archive_file" "stepfn_invoker_zip" {
  type        = "zip"
  source_dir  = "../lambdas/stepfnInvoker"
  output_path = "../lambdas/stepfnInvoker.zip"
}
# ==========================================
# IAM ROLE FOR LAMBDA
# ==========================================

resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"

      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_stepfn_policy" {
  name = "lambda-stepfn-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Action = [
        "states:StartSyncExecution"
      ]

      Resource = aws_sfn_state_machine.faq.arn
    }]
  })
}

# ==========================================
# LAMBDA FUNCTIONS
# ==========================================

resource "aws_lambda_function" "validate" {
  function_name = "validateLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.validate_zip.output_path
  source_code_hash = data.archive_file.validate_zip.output_base64sha256
}

resource "aws_lambda_function" "dblookup" {
  function_name = "dbLookupLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.dblookup_zip.output_path
  source_code_hash = data.archive_file.dblookup_zip.output_base64sha256

  environment {
    variables = {
      MONGO_URI = var.mongo_uri
    }
  }
}

resource "aws_lambda_function" "fallback" {
  function_name = "fallbackLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.fallback_zip.output_path
  source_code_hash = data.archive_file.fallback_zip.output_base64sha256
}

resource "aws_lambda_function" "store" {
  function_name = "storeLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.store_zip.output_path
  source_code_hash = data.archive_file.store_zip.output_base64sha256

  environment {
    variables = {
      MONGO_URI = var.mongo_uri
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_lambda_function" "stepfn_invoker" {
  function_name = "${var.project_name}-stepfn-invoker"

  role    = aws_iam_role.lambda_role.arn
  runtime = "nodejs20.x"
  handler = "index.handler"

  filename         = data.archive_file.stepfn_invoker_zip.output_path
  source_code_hash = data.archive_file.stepfn_invoker_zip.output_base64sha256

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.faq.arn
    }
  }
}

resource "aws_lambda_permission" "faq_apigw" {
  statement_id  = "AllowApiGatewayInvokeFaq"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stepfn_invoker.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/POST/faq"
}
# ==========================================
# STEP FUNCTION ROLE
# ==========================================

resource "aws_iam_role" "stepfn_role" {
  name = "${var.project_name}-${var.environment}-stepfn-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Principal = {
        Service = "states.amazonaws.com"
      }

      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "stepfn_policy" {
  name = "faq-stepfn-policy"
  role = aws_iam_role.stepfn_role.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Action = [
        "lambda:InvokeFunction"
      ]

      Resource = [
        aws_lambda_function.validate.arn,
        aws_lambda_function.dblookup.arn,
        aws_lambda_function.fallback.arn,
        aws_lambda_function.store.arn
      ]
    }]
  })
}

# ==========================================
# STEP FUNCTIONS
# ==========================================

resource "aws_sfn_state_machine" "faq" {
  name     = "faqWorkflow"
  role_arn = aws_iam_role.stepfn_role.arn

  type = "EXPRESS"
  definition = jsonencode({
    Comment = "FAQ Workflow"

    StartAt = "Validate"

    States = {

      Validate = {
        Type     = "Task"
        Resource = aws_lambda_function.validate.arn
        Parameters = {
          "question.$" = "$.question"
        }

        Next = "DBLookup"
      }

      DBLookup = {
        Type     = "Task"
        Resource = aws_lambda_function.dblookup.arn
        Next     = "CheckFound"
      }

      CheckFound = {
        Type = "Choice"

        Choices = [
          {
            Variable      = "$.found"
            BooleanEquals = true
            Next          = "ReturnFound"
          }
        ]

        Default = "Fallback"
      }

      ReturnFound = {
        Type = "Pass"
        End  = true
      }

      Fallback = {
        Type     = "Task"
        Resource = aws_lambda_function.fallback.arn
        Next     = "Store"
      }

      Store = {
        Type     = "Task"
        Resource = aws_lambda_function.store.arn
        End      = true
      }
    }
  })
}

# ==========================================
# API GATEWAY
# ==========================================

resource "aws_apigatewayv2_api" "http_api" {
  name          = "faq-http-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# ==========================================
# OUTPUT
# ==========================================

output "api_gateway_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

resource "aws_apigatewayv2_integration" "validate_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.validate.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "validate_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /validate"
  target    = "integrations/${aws_apigatewayv2_integration.validate_integration.id}"
}


resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.validate.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/POST/validate"
}




resource "aws_apigatewayv2_integration" "faq_lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.stepfn_invoker.invoke_arn
  payload_format_version = "2.0"
}

# resource "aws_apigatewayv2_integration" "stepfn_integration" {
#   api_id              = aws_apigatewayv2_api.http_api.id
#   integration_type    = "AWS_PROXY"
#   integration_subtype = "StepFunctions-StartExecution"
#   payload_format_version = "1.0"

#   credentials_arn     = aws_iam_role.api_gateway_stepfn_role.arn

#   # payload_format_version = "1.0"

#   request_parameters = {
#     StateMachineArn = aws_sfn_state_machine.faq.arn
#     Input = "$request.body"
#   }

#   # request_templates = {
#   #  "application/json" = jsonencode({
#   #    input = "$util.escapeJavaScript($input.body)"
#   #  })
#   # }
# }


resource "aws_iam_role" "api_gateway_stepfn_role" {
  name = "${var.project_name}-${var.environment}-apigw-stepfn-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "api_gateway_stepfn_policy" {
  role = aws_iam_role.api_gateway_stepfn_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "states:StartExecution"
      ]
      Resource = aws_sfn_state_machine.faq.arn
    }]
  })
}

resource "aws_apigatewayv2_route" "faq_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /faq"

  # target = "integrations/${aws_apigatewayv2_integration.stepfn_integration.id}"
  target = "integrations/${aws_apigatewayv2_integration.faq_lambda_integration.id}"
}

