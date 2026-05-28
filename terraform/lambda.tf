##################################################
# RANDOM ID FOR UNIQUE S3 BUCKET
##################################################

resource "random_id" "bucket_id" {
  byte_length = 4
}

##################################################
# S3 BUCKET
##################################################

resource "aws_s3_bucket" "employee_bucket" {

  bucket = "employee-system-${random_id.bucket_id.hex}"

  tags = {
    Name = "employee-system-bucket"
  }
}

##################################################
# LOGIN LAMBDA
##################################################

resource "aws_lambda_function" "login" {

  function_name = "loginLambda"

  role    = aws_iam_role.lambda_role.arn
  runtime = "nodejs20.x"
  handler = "index.handler"

  filename         = "../login.zip"
  source_code_hash = filebase64sha256("../login.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      JWT_SECRET = var.jwt_secret
      MONGO_URL  = var.mongo_url
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic
  ]

  tags = {
    Name = "login-lambda"
  }
}

##################################################
# VALIDATE JWT LAMBDA
##################################################

resource "aws_lambda_function" "validateJwt" {

  function_name = "validateJwtLambda"

  role    = aws_iam_role.lambda_role.arn
  runtime = "nodejs20.x"
  handler = "index.handler"

  filename         = "../validateJwt.zip"
  source_code_hash = filebase64sha256("../validateJwt.zip")

  timeout     = 15
  memory_size = 128

  environment {
    variables = {
      JWT_SECRET = var.jwt_secret
    }
  }

  depends_on = [ 
    aws_lambda_function.login,
    aws_iam_role_policy_attachment.lambda_basic
  ]

  tags = {
    Name = "validate-jwt-lambda"
  }
}

##################################################
# CREATE EMPLOYEE LAMBDA
##################################################

resource "aws_lambda_function" "createEmployee" {

  function_name = "createEmployeeLambda"

  role    = aws_iam_role.lambda_role.arn
  runtime = "nodejs20.x"
  handler = "index.handler"

  filename         = "../createEmployee.zip"
  source_code_hash = filebase64sha256("../createEmployee.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      MONGO_URL = var.mongo_url
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic
  ]

  tags = {
    Name = "create-employee-lambda"
  }
}

##################################################
# UPLOAD IMAGE LAMBDA
##################################################

resource "aws_lambda_function" "uploadImage" {

  function_name = "uploadImageLambda"

  role    = aws_iam_role.lambda_role.arn
  runtime = "nodejs20.x"
  handler = "index.handler"

  filename         = "../uploadImage.zip"
  source_code_hash = filebase64sha256("../uploadImage.zip")

  timeout     = 60
  memory_size = 512

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.employee_bucket.bucket
      JWT_SECRET  = var.jwt_secret
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_s3
  ]

  tags = {
    Name = "upload-image-lambda"
  }
}

##################################################
# UPDATE EMPLOYEE LAMBDA
##################################################

resource "aws_lambda_function" "updateEmployee" {

  function_name = "updateEmployeeLambda"

  role    = aws_iam_role.lambda_role.arn
  runtime = "nodejs20.x"
  handler = "index.handler"

  filename         = "../updateEmployee.zip"
  source_code_hash = filebase64sha256("../updateEmployee.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      MONGO_URL = var.mongo_url
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic
  ]

  tags = {
    Name = "update-employee-lambda"
  }
}