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

  force_destroy = true

  tags = {
    Name = "employee-system-bucket"
  }
}

##################################################
# SEED ADMIN LAMBDA
##################################################

resource "aws_lambda_function" "seedAdmin" {

  function_name = "seedAdminLambda"

  role    = aws_iam_role.lambda_role.arn
  runtime = "nodejs20.x"
  handler = "index.handler"

  filename         = "../zips/seedAdmin.zip"
  source_code_hash = filebase64sha256("../zips/seedAdmin.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      MONGO_URI = var.mongo_url
      JWT_SECRET = var.jwt_secret
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic
  ]

  tags = {
    Name = "seed-admin-lambda"
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

  filename         = "../zips/login.zip"
  source_code_hash = filebase64sha256("../zips/login.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      JWT_SECRET = var.jwt_secret
      MONGO_URI  = var.mongo_url
    }
  }

  depends_on = [
    aws_lambda_function.seedAdmin
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

  filename         = "../zips/validateJwt.zip"
  source_code_hash = filebase64sha256("../zips/validateJwt.zip")

  timeout     = 15
  memory_size = 128

  environment {
    variables = {
      JWT_SECRET = var.jwt_secret
    }
  }

  depends_on = [
    aws_lambda_function.login
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

  filename         = "../zips/createEmployee.zip"
  source_code_hash = filebase64sha256("../zips/createEmployee.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      MONGO_URI = var.mongo_url
      JWT_SECRET = var.jwt_secret
    }
  }

  depends_on = [
    aws_lambda_function.validateJwt
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

  filename         = "../zips/uploadImage.zip"
  source_code_hash = filebase64sha256("../zips/uploadImage.zip")

  timeout     = 60
  memory_size = 512

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.employee_bucket.bucket
      JWT_SECRET  = var.jwt_secret
    }
  }

  depends_on = [
    aws_lambda_function.createEmployee,
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

  filename         = "../zips/updateEmployee.zip"
  source_code_hash = filebase64sha256("../zips/updateEmployee.zip")

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      MONGO_URI = var.mongo_url
      JWT_SECRET = var.jwt_secret
    }
  }

  depends_on = [
    aws_lambda_function.uploadImage
  ]

  tags = {
    Name = "update-employee-lambda"
  }
}