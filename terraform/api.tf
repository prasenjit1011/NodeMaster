##################################################
# API GATEWAY
##################################################

resource "aws_apigatewayv2_api" "employee_api" {

  name          = "employee-api"
  protocol_type = "HTTP"

  cors_configuration {

    allow_credentials = false

    allow_headers = [
      "content-type",
      "authorization"
    ]

    allow_methods = [
      "*"
    ]

    allow_origins = [
      "*"
    ]

    expose_headers = [
      "*"
    ]

    max_age = 300
  }
}

##################################################
# LOGIN LAMBDA INTEGRATION
##################################################

resource "aws_apigatewayv2_integration" "login_integration" {

  api_id                 = aws_apigatewayv2_api.employee_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.login.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"

  timeout_milliseconds = 30000
}

resource "aws_apigatewayv2_route" "login_route" {

  api_id    = aws_apigatewayv2_api.employee_api.id
  route_key = "POST /login"

  target = "integrations/${aws_apigatewayv2_integration.login_integration.id}"
}

resource "aws_lambda_permission" "login_permission" {

  statement_id  = "AllowAPIGatewayInvokeLogin"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.login.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.employee_api.execution_arn}/*/*"
}

##################################################
# CREATE EMPLOYEE LAMBDA INTEGRATION
##################################################

resource "aws_apigatewayv2_integration" "employee_integration" {

  api_id                 = aws_apigatewayv2_api.employee_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.createEmployee.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"

  timeout_milliseconds = 30000
}

resource "aws_apigatewayv2_route" "employee_route" {

  api_id    = aws_apigatewayv2_api.employee_api.id
  route_key = "POST /employee"

  target = "integrations/${aws_apigatewayv2_integration.employee_integration.id}"
}

resource "aws_lambda_permission" "employee_permission" {

  statement_id  = "AllowAPIGatewayInvokeEmployee"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.createEmployee.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.employee_api.execution_arn}/*/*"
}

##################################################
# UPLOAD IMAGE LAMBDA INTEGRATION
##################################################

resource "aws_apigatewayv2_integration" "upload_integration" {

  api_id                 = aws_apigatewayv2_api.employee_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.uploadImage.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"

  timeout_milliseconds = 30000
}

resource "aws_apigatewayv2_route" "upload_route" {

  api_id    = aws_apigatewayv2_api.employee_api.id
  route_key = "POST /upload"

  target = "integrations/${aws_apigatewayv2_integration.upload_integration.id}"
}

resource "aws_lambda_permission" "upload_permission" {

  statement_id  = "AllowAPIGatewayInvokeUpload"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.uploadImage.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.employee_api.execution_arn}/*/*"
}

##################################################
# UPDATE EMPLOYEE LAMBDA INTEGRATION
##################################################

resource "aws_apigatewayv2_integration" "update_integration" {

  api_id                 = aws_apigatewayv2_api.employee_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.updateEmployee.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"

  timeout_milliseconds = 30000
}

resource "aws_apigatewayv2_route" "update_route" {

  api_id    = aws_apigatewayv2_api.employee_api.id
  route_key = "PUT /employee"

  target = "integrations/${aws_apigatewayv2_integration.update_integration.id}"
}

resource "aws_lambda_permission" "update_permission" {

  statement_id  = "AllowAPIGatewayInvokeUpdate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.updateEmployee.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.employee_api.execution_arn}/*/*"
}

##################################################
# VALIDATE JWT LAMBDA INTEGRATION
##################################################

resource "aws_apigatewayv2_integration" "validate_integration" {

  api_id                 = aws_apigatewayv2_api.employee_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.validateJwt.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"

  timeout_milliseconds = 30000
}

resource "aws_apigatewayv2_route" "validate_route" {

  api_id    = aws_apigatewayv2_api.employee_api.id
  route_key = "GET /validate"

  target = "integrations/${aws_apigatewayv2_integration.validate_integration.id}"
}

resource "aws_lambda_permission" "validate_permission" {

  statement_id  = "AllowAPIGatewayInvokeValidate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.validateJwt.function_name

  principal = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.employee_api.execution_arn}/*/*"
}

##################################################
# DEFAULT STAGE
##################################################

resource "aws_apigatewayv2_stage" "default" {

  api_id = aws_apigatewayv2_api.employee_api.id

  name = "$default"

  auto_deploy = true

  access_log_settings {

    destination_arn = aws_cloudwatch_log_group.api_logs.arn

    format = jsonencode({
      requestId      = "$context.requestId"
      sourceIp       = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      protocol       = "$context.protocol"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
    })
  }

  default_route_settings {

    detailed_metrics_enabled = true
    throttling_burst_limit   = 100
    throttling_rate_limit    = 50
  }
}

##################################################
# CLOUDWATCH LOG GROUP
##################################################

resource "aws_cloudwatch_log_group" "api_logs" {

  name              = "/aws/apigateway/employee-api"
  retention_in_days = 7
}