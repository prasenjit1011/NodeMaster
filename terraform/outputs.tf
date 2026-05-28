output "api_id" {
  value = aws_apigatewayv2_api.employee_api.id
}

output "s3_bucket" {
  value = aws_s3_bucket.employee_bucket.bucket
}

output "api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "login_api" {
  value = "${aws_apigatewayv2_stage.default.invoke_url}/login"
}

output "employee_api" {
  value = "${aws_apigatewayv2_stage.default.invoke_url}/employee"
}

output "upload_api" {
  value = "${aws_apigatewayv2_stage.default.invoke_url}/upload"
}