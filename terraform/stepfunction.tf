##################################################
# STEP FUNCTION ROLE
##################################################

resource "aws_iam_role" "step_function_role" {

  name = "employee-step-function-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "states.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

##################################################
# ALLOW STEP FUNCTION TO INVOKE LAMBDAS
##################################################

resource "aws_iam_role_policy" "step_function_policy" {

  name = "employee-step-function-policy"

  role = aws_iam_role.step_function_role.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "lambda:InvokeFunction"
        ]

        Resource = [
          aws_lambda_function.jwtValidation.arn,
          aws_lambda_function.createEmployee.arn,
          aws_lambda_function.updateEmployee.arn,
          aws_lambda_function.uploadEmployeeImage.arn
        ]
      }
    ]
  })
}

##################################################
# STEP FUNCTION
##################################################

resource "aws_sfn_state_machine" "employee_flow" {

  name     = "employee-flow"

  role_arn = aws_iam_role.step_function_role.arn

  definition = jsonencode({

    Comment = "Employee Workflow with JWT Validation"

    StartAt = "ValidateJWT"

    States = {

      ValidateJWT = {

        Type = "Task"

        Resource = aws_lambda_function.jwtValidation.arn

        ResultPath = "$.auth"

        Next = "EmployeeAction"
      }

      EmployeeAction = {

        Type = "Choice"

        Choices = [

          {
            Variable = "$.action"

            StringEquals = "create"

            Next = "CreateEmployee"
          },

          {
            Variable = "$.action"

            StringEquals = "update"

            Next = "UpdateEmployee"
          },

          {
            Variable = "$.action"

            StringEquals = "upload"

            Next = "UploadEmployeeImage"
          }
        ]

        Default = "InvalidAction"
      }

      CreateEmployee = {

        Type = "Task"

        Resource = aws_lambda_function.createEmployee.arn

        End = true
      }

      UpdateEmployee = {

        Type = "Task"

        Resource = aws_lambda_function.updateEmployee.arn

        End = true
      }

      UploadEmployeeImage = {

        Type = "Task"

        Resource = aws_lambda_function.uploadEmployeeImage.arn

        End = true
      }

      InvalidAction = {

        Type = "Fail"

        Error = "InvalidAction"

        Cause = "Action must be create/update/upload"
      }
    }
  })
}