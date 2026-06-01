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

data "archive_file" "validate_leave_zip" {
  type        = "zip"
  source_dir  = "../lambdas/validateLeave"
  output_path = "../lambdas/validateLeave.zip"
}

data "archive_file" "create_leave_zip" {
  type        = "zip"
  source_dir  = "../lambdas/createLeave"
  output_path = "../lambdas/createLeave.zip"
}

data "archive_file" "manager_approval_zip" {
  type        = "zip"
  source_dir  = "../lambdas/managerApproval"
  output_path = "../lambdas/managerApproval.zip"
}

data "archive_file" "hr_approval_zip" {
  type        = "zip"
  source_dir  = "../lambdas/hrApproval"
  output_path = "../lambdas/hrApproval.zip"
}

data "archive_file" "update_balance_zip" {
  type        = "zip"
  source_dir  = "../lambdas/updateBalance"
  output_path = "../lambdas/updateBalance.zip"
}

data "archive_file" "send_email_zip" {
  type        = "zip"
  source_dir  = "../lambdas/sendEmail"
  output_path = "../lambdas/sendEmail.zip"
}

data "archive_file" "stepfn_invoker_zip" {
  type        = "zip"
  source_dir  = "../lambdas/stepfnInvoker"
  output_path = "../lambdas/stepfnInvoker.zip"
}

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

      Resource = aws_sfn_state_machine.leave_workflow.arn
    }]
  })
}




resource "aws_lambda_function" "validate_leave" {
  function_name = "validateLeaveLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.validate_leave_zip.output_path  
  source_code_hash = data.archive_file.validate_leave_zip.output_base64sha256
}

resource "aws_lambda_function" "create_leave" {
  function_name = "createLeaveLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.create_leave_zip.output_path
  source_code_hash = data.archive_file.create_leave_zip.output_base64sha256

  environment {
    variables = {
      MONGO_URI = var.mongo_uri
    }
  }
}

resource "aws_lambda_function" "manager_approval" {
  function_name = "managerApprovalLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.manager_approval_zip.output_path
  source_code_hash = data.archive_file.manager_approval_zip.output_base64sha256
}

resource "aws_lambda_function" "hr_approval" {
  function_name = "hrApprovalLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.hr_approval_zip.output_path
  source_code_hash = data.archive_file.hr_approval_zip.output_base64sha256

  environment {
    variables = {
      MONGO_URI = var.mongo_uri
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}



resource "aws_lambda_function" "update_balance" {
  function_name = "updateBalanceLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.update_balance_zip.output_path
  source_code_hash = data.archive_file.update_balance_zip.output_base64sha256
}


resource "aws_lambda_function" "send_email" {
  function_name = "sendEmailLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.send_email_zip.output_path
  source_code_hash = data.archive_file.send_email_zip.output_base64sha256
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
      STATE_MACHINE_ARN = aws_sfn_state_machine.leave_workflow.arn
    }
  }
}








resource "aws_lambda_permission" "faq_apigw" {
  statement_id  = "AllowApiGatewayInvokeFaq"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stepfn_invoker.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/POST/leave/apply"
}

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
        aws_lambda_function.validate_leave.arn,
        aws_lambda_function.create_leave.arn,
        aws_lambda_function.manager_approval.arn,
        aws_lambda_function.hr_approval.arn,
        aws_lambda_function.update_balance.arn,
        aws_lambda_function.send_email.arn
      ]
    }]
  })
}


resource "aws_sfn_state_machine" "leave_workflow" {
  name     = "employeeLeaveWorkflow"
  role_arn = aws_iam_role.stepfn_role.arn

  type = "EXPRESS"

  definition = jsonencode({
    Comment = "Employee Leave Approval Workflow"

    StartAt = "ValidateLeave"

    States = {

      ValidateLeave = {
        Type     = "Task"
        Resource = aws_lambda_function.validate_leave.arn
        Next     = "CreateLeave"
      }

      CreateLeave = {
        Type     = "Task"
        Resource = aws_lambda_function.create_leave.arn
        Next     = "ManagerApproval"
      }

      ManagerApproval = {
        Type     = "Task"
        Resource = aws_lambda_function.manager_approval.arn
        Next     = "HRApproval"
      }

      HRApproval = {
        Type     = "Task"
        Resource = aws_lambda_function.hr_approval.arn
        Next     = "UpdateBalance"
      }

      UpdateBalance = {
        Type     = "Task"
        Resource = aws_lambda_function.update_balance.arn
        Next     = "SendEmail"
      }

      SendEmail = {
        Type     = "Task"
        Resource = aws_lambda_function.send_email.arn
        End      = true
      }
    }
  })
}


resource "aws_apigatewayv2_api" "http_api" {
  name          = "leave-approval-http-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

output "api_gateway_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

resource "aws_apigatewayv2_integration" "validate_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.validate_leave.invoke_arn
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
  function_name = aws_lambda_function.validate_leave.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.http_api.execution_arn}/*/POST/validate"
}




resource "aws_apigatewayv2_integration" "faq_lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.stepfn_invoker.invoke_arn
  payload_format_version = "2.0"
  lifecycle {
    create_before_destroy = true
  }
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
      Resource = aws_sfn_state_machine.leave_workflow.arn
    }]
  })
}

resource "aws_apigatewayv2_route" "faq_route" {
  api_id    = aws_apigatewayv2_api.http_api.id 
  route_key = "POST /leave/apply"

  target = "integrations/${aws_apigatewayv2_integration.faq_lambda_integration.id}"
}

