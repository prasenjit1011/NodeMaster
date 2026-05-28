resource "aws_apigatewayv2_api" "employee_api" {
  name          = "employee-api"
  protocol_type = "HTTP"
}