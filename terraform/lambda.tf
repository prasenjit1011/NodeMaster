resource "aws_lambda_function" "login" {
  function_name = "loginLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "../login.zip"
}
