resource "aws_apigatewayv2_api" "http_api" {
  name          = "faq-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "sfn" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_sfn_state_machine.faq.arn
}