resource "aws_api_gateway_method" "upload_post" {

  rest_api_id   = aws_api_gateway_rest_api.employee_api.id
  resource_id   = aws_api_gateway_resource.upload.id
  http_method   = "POST"

  authorization = "CUSTOM"

  authorizer_id = aws_api_gateway_authorizer.jwt_authorizer.id
}

resource "aws_api_gateway_method" "employee_update" {

  rest_api_id   = aws_api_gateway_rest_api.employee_api.id
  resource_id   = aws_api_gateway_resource.employee_id.id
  http_method   = "PUT"

  authorization = "CUSTOM"

  authorizer_id = aws_api_gateway_authorizer.jwt_authorizer.id
}

resource "aws_api_gateway_method" "login_post" {

  rest_api_id   = aws_api_gateway_rest_api.employee_api.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "POST"

  authorization = "NONE"
}



resource "aws_api_gateway_authorizer" "jwt_authorizer" {

  name            = "jwt-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.employee_api.id
  authorizer_uri  = aws_lambda_function.jwt_authorizer.invoke_arn
  type            = "TOKEN"
  identity_source = "method.request.header.Authorization"
}


resource "aws_lambda_permission" "allow_apigw_authorizer" {

  statement_id  = "AllowExecutionFromAPIGatewayAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jwt_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
}