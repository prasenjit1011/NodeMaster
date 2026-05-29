# ==========================================
# ZIP LAMBDAS
# ==========================================

data "archive_file" "validate_zip" {
  type        = "zip"
  source_dir  = "../lambdas/validate"
  output_path = "../lambdas/validate.zip"
}

data "archive_file" "dblookup_zip" {
  type        = "zip"
  source_dir  = "../lambdas/dbLookup"
  output_path = "../lambdas/dbLookup.zip"
}

data "archive_file" "fallback_zip" {
  type        = "zip"
  source_dir  = "../lambdas/fallback"
  output_path = "../lambdas/fallback.zip"
}

data "archive_file" "store_zip" {
  type        = "zip"
  source_dir  = "../lambdas/store"
  output_path = "../lambdas/store.zip"
}

# ==========================================
# IAM ROLE FOR LAMBDA
# ==========================================

resource "aws_iam_role" "lambda_role" {
  name = "faq-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [{
      Effect = "Allow"

      Principal = {
        Service = "lambda.amazonaws.com"
      }

      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ==========================================
# VALIDATE LAMBDA
# ==========================================

resource "aws_lambda_function" "validate" {
  function_name = "validateLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.validate_zip.output_path
  source_code_hash = data.archive_file.validate_zip.output_base64sha256

  timeout = 10
}

# ==========================================
# DB LOOKUP LAMBDA
# ==========================================

resource "aws_lambda_function" "dblookup" {
  function_name = "dbLookupLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.dblookup_zip.output_path
  source_code_hash = data.archive_file.dblookup_zip.output_base64sha256

  timeout = 15

  environment {
    variables = {
      MONGO_URI = var.mongo_uri
    }
  }
}

# ==========================================
# FALLBACK LAMBDA
# ==========================================

resource "aws_lambda_function" "fallback" {
  function_name = "fallbackLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.fallback_zip.output_path
  source_code_hash = data.archive_file.fallback_zip.output_base64sha256

  timeout = 10
}

# ==========================================
# STORE LAMBDA
# ==========================================

resource "aws_lambda_function" "store" {
  function_name = "storeLambda"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"

  filename         = data.archive_file.store_zip.output_path
  source_code_hash = data.archive_file.store_zip.output_base64sha256

  timeout = 15

  environment {
    variables = {
      MONGO_URI = var.mongo_uri
    }
  }
}