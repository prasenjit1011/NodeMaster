# employee-system Full Source Code

```text
employee-system/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── terraform/
│   ├── main.tf
│   ├── lambda.tf
│   ├── api.tf
│   ├── stepfunction.tf
│   ├── iam.tf
│   ├── variables.tf
│   └── outputs.tf
│
├── lambdas/
│   │
│   ├── login/
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── validateJwt/
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── createEmployee/
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── uploadImage/
│   │   ├── index.js
│   │   └── package.json
│   │
│   └── updateEmployee/
│       ├── index.js
│       └── package.json
│
└── stepfunction/
    └── employee-flow.json
```

---

# .github/workflows/deploy.yml

```yaml
name: Deploy Employee System

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup NodeJS
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - name: Zip Login Lambda
        run: |
          cd lambdas/login
          npm install
          zip -r ../../login.zip .

      - name: Zip Validate JWT Lambda
        run: |
          cd lambdas/validateJwt
          npm install
          zip -r ../../validateJwt.zip .

      - name: Zip Create Employee Lambda
        run: |
          cd lambdas/createEmployee
          npm install
          zip -r ../../createEmployee.zip .

      - name: Zip Upload Image Lambda
        run: |
          cd lambdas/uploadImage
          npm install
          zip -r ../../uploadImage.zip .

      - name: Zip Update Employee Lambda
        run: |
          cd lambdas/updateEmployee
          npm install
          zip -r ../../updateEmployee.zip .

      - name: Terraform Init
        run: |
          cd terraform
          terraform init

      - name: Terraform Apply
        run: |
          cd terraform
          terraform apply -auto-approve
```

---

# terraform/main.tf

```tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

---

# terraform/variables.tf

```tf
variable "aws_region" {
  default = "ap-south-1"
}

variable "mongo_url" {
  default = "mongodb+srv://myuser:password@cluster0.hlicuim.mongodb.net/demodb?retryWrites=true&w=majority&appName=Cluster0"
}

variable "jwt_secret" {
  default = "MY_SECRET"
}
```

---

# terraform/iam.tf

```tf
resource "aws_iam_role" "lambda_role" {
  name = "employee-system-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role" "step_function_role" {
  name = "employee-step-function-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "step_function_policy" {
  name = "employee-step-policy"
  role = aws_iam_role.step_function_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "*"
      }
    ]
  })
}
```

---

# terraform/lambda.tf

```tf
resource "aws_s3_bucket" "employee_bucket" {
  bucket = "employee-system-image-bucket-demo-2026"
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
```

---

# terraform/api.tf

```tf
resource "aws_apigatewayv2_api" "employee_api" {
  name          = "employee-api"
  protocol_type = "HTTP"
}
```

---

# terraform/stepfunction.tf

```tf
resource "aws_sfn_state_machine" "employee_flow" {
  name     = "employee-flow"
  role_arn = aws_iam_role.step_function_role.arn

  definition = file("../stepfunction/employee-flow.json")
}
```

---

# terraform/outputs.tf

```tf
output "api_id" {
  value = aws_apigatewayv2_api.employee_api.id
}

output "s3_bucket" {
  value = aws_s3_bucket.employee_bucket.bucket
}
```

---

# lambdas/login/index.js

```javascript
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;

exports.handler = async (event) => {

    const body = JSON.parse(event.body);

    const client = new MongoClient(uri);

    await client.connect();

    const db = client.db('demodb');

    const user = await db.collection('users').findOne({
        username: body.username,
        password: body.password
    });

    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: 'Invalid credentials'
            })
        };
    }

    const token = jwt.sign(
        {
            username: user.username
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            token
        })
    };
};
```

---

# lambdas/login/package.json

```json
{
  "name": "login-lambda",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^6.5.0"
  }
}
```

---

# lambdas/validateJwt/index.js

```javascript
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {

    try {

        const token = event.headers.Authorization ||
            event.headers.authorization;

        if (!token) {
            throw new Error('Token missing');
        }

        const decoded = jwt.verify(
            token.replace('Bearer ', ''),
            process.env.JWT_SECRET
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                valid: true,
                user: decoded
            })
        };

    } catch (error) {

        return {
            statusCode: 401,
            body: JSON.stringify({
                valid: false,
                message: error.message
            })
        };
    }
};
```

---

# lambdas/validateJwt/package.json

```json
{
  "name": "validate-jwt-lambda",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "jsonwebtoken": "^9.0.2"
  }
}
```

---

# lambdas/createEmployee/index.js

```javascript
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;

exports.handler = async (event) => {

    const body = JSON.parse(event.body);

    const client = new MongoClient(uri);

    await client.connect();

    const db = client.db('demodb');

    const employee = {
        name: body.name,
        email: body.email,
        mobile: body.mobile,
        department: body.department,
        createdAt: new Date()
    };

    const result = await db
        .collection('employees')
        .insertOne(employee);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Employee created successfully',
            employeeId: result.insertedId
        })
    };
};
```

---

# lambdas/createEmployee/package.json

```json
{
  "name": "create-employee-lambda",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "mongodb": "^6.5.0"
  }
}
```

---

# lambdas/uploadImage/index.js

```javascript
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const s3 = new AWS.S3();

exports.handler = async (event) => {

    try {

        const token = event.headers.Authorization ||
            event.headers.authorization;

        if (!token) {
            throw new Error('JWT token required');
        }

        jwt.verify(
            token.replace('Bearer ', ''),
            process.env.JWT_SECRET
        );

        const body = JSON.parse(event.body);

        const buffer = Buffer.from(
            body.base64Image,
            'base64'
        );

        const fileName = `${Date.now()}.png`;

        await s3.putObject({
            Bucket: process.env.BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: 'image/png'
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Image uploaded successfully',
                fileName
            })
        };

    } catch (error) {

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};
```

---

# lambdas/uploadImage/package.json

```json
{
  "name": "upload-image-lambda",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1692.0",
    "jsonwebtoken": "^9.0.2"
  }
}
```

---

# lambdas/updateEmployee/index.js

```javascript
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URL;

exports.handler = async (event) => {

    const body = JSON.parse(event.body);

    const client = new MongoClient(uri);

    await client.connect();

    const db = client.db('demodb');

    await db.collection('employees').updateOne(
        {
            _id: new ObjectId(body.id)
        },
        {
            $set: {
                name: body.name,
                email: body.email,
                mobile: body.mobile,
                updatedAt: new Date()
            }
        }
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Employee updated successfully'
        })
    };
};
```

---

# lambdas/updateEmployee/package.json

```json
{
  "name": "update-employee-lambda",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "mongodb": "^6.5.0"
  }
}
```

---

# stepfunction/employee-flow.json

```json
{
  "Comment": "Employee System Workflow",
  "StartAt": "ValidateJWT",
  "States": {
    "ValidateJWT": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-south-1:123456789012:function:validateJwtLambda",
      "Next": "CreateEmployee"
    },
    "CreateEmployee": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-south-1:123456789012:function:createEmployeeLambda",
      "Next": "UploadImage"
    },
    "UploadImage": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-south-1:123456789012:function:uploadImageLambda",
      "Next": "UpdateEmployee"
    },
    "UpdateEmployee": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-south-1:123456789012:function:updateEmployeeLambda",
      "End": true
    }
  }
}
```

---

# Deploy Commands

```bash
git init
git add .
git commit -m "employee system"

terraform init
terraform apply -auto-approve
```

---

# API Testing

## Login API

```bash
POST /login

{
  "username": "admin",
  "password": "admin123"
}
```

## Create Employee API

```bash
POST /employee
Authorization: Bearer TOKEN

{
  "name": "John",
  "email": "john@gmail.com",
  "mobile": "9999999999",
  "department": "IT"
}
```

## Upload Image API

```bash
POST /upload-image
Authorization: Bearer TOKEN

{
  "base64Image": "BASE64_STRING"
}
```
