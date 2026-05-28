resource "aws_apigatewayv2_api" "employee_api" {
  name          = "employee-api"
  protocol_type = "HTTP"
}

# =========================
# LOGIN LAMBDA INTEGRATION
# =========================

resource "aws_apigatewayv2_integration" "login_integration" {
  api_id                 = aws_apigatewayv2_api.employee_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.login.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "login_route" {
  api_id    = aws_apigatewayv2_api.employee_api.id
  route_key = "POST /login"
  target    = "integrations/${aws_apigatewayv2_integration.login_integration.id}"
}

resource "aws_lambda_permission" "login_permission" {
  statement_id  = "AllowAPIGatewayInvokeLogin"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.login.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.employee_api.execution_arn}/*/*"
}

# =========================
# CREATE EMPLOYEE
# =========================

resource "aws_apigatewayv2_integration" "employee_integration" {
  api_id                 = aws_apigatewayv2_api.employee_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.createEmployee.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "employee_route" {
  api_id    = aws_apigatewayv2_api.employee_api.id
  route_key = "POST /employee"
  target    = "integrations/${aws_apigatewayv2_integration.employee_integration.id}"
}

resource "aws_lambda_permission" "employee_permission" {
  statement_id  = "AllowAPIGatewayInvokeEmployee"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.createEmployee.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.employee_api.execution_arn}/*/*"
}

# =========================
# DEFAULT STAGE
# =========================

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.employee_api.id
  name        = "$default"
  auto_deploy = true
}
