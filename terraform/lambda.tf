resource "aws_s3_bucket" "employee_bucket" {
  bucket = "employee-system-${random_id.bucket_id.hex}"
}

resource "random_id" "bucket_id" {
  byte_length = 4
}

resource "aws_lambda_function" "login" {
  function_name = "loginLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "../login.zip"

  source_code_hash = filebase64sha256("../login.zip")

  environment {
    variables = {
      JWT_SECRET = var.jwt_secret
      MONGO_URL  = var.mongo_url
    }
  }
}

resource "aws_lambda_function" "validateJwt" {
  function_name = "validateJwtLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "../validateJwt.zip"

  source_code_hash = filebase64sha256("../validateJwt.zip")

  environment {
    variables = {
      JWT_SECRET = var.jwt_secret
    }
  }
}

resource "aws_lambda_function" "createEmployee" {
  function_name = "createEmployeeLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "../createEmployee.zip"

  source_code_hash = filebase64sha256("../createEmployee.zip")

  environment {
    variables = {
      MONGO_URL = var.mongo_url
    }
  }
}

resource "aws_lambda_function" "uploadImage" {
  function_name = "uploadImageLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "../uploadImage.zip"

  source_code_hash = filebase64sha256("../uploadImage.zip")

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.employee_bucket.bucket
      JWT_SECRET  = var.jwt_secret
    }
  }
}

resource "aws_lambda_function" "updateEmployee" {
  function_name = "updateEmployeeLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "../updateEmployee.zip"

  source_code_hash = filebase64sha256("../updateEmployee.zip")

  environment {
    variables = {
      MONGO_URL = var.mongo_url
    }
  }
}