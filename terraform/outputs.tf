output "api_id" {
  value = aws_apigatewayv2_api.employee_api.id
}

output "s3_bucket" {
  value = aws_s3_bucket.employee_bucket.bucket
}