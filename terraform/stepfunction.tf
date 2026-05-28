##################################################
# STEP FUNCTION
##################################################

resource "aws_sfn_state_machine" "employee_flow" {

  name = "employee-flow"

  role_arn = aws_iam_role.step_function_role.arn

  definition = jsonencode({

    Comment = "Employee Workflow with JWT Validation"

    StartAt = "ValidateJWT"

    States = {

      ##################################################
      # VALIDATE JWT
      ##################################################

      ValidateJWT = {

        Type = "Task"

        Resource = "arn:aws:states:::lambda:invoke"

        TimeoutSeconds = 30

        Parameters = {

          FunctionName =
            aws_lambda_function.validateJwt.arn

          Payload.$ = "$"
        }

        ResultPath = "$.auth"

        Next = "CheckAuthorization"
      }

      ##################################################
      # CHECK AUTHORIZATION
      ##################################################

      CheckAuthorization = {

        Type = "Choice"

        Choices = [

          {

            Variable =
              "$.auth.Payload.statusCode"

            NumericEquals = 200

            Next = "EmployeeAction"
          }
        ]

        Default = "Unauthorized"
      }

      ##################################################
      # EMPLOYEE ACTION ROUTER
      ##################################################

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

      ##################################################
      # CREATE EMPLOYEE
      ##################################################

      CreateEmployee = {

        Type = "Task"

        Resource = "arn:aws:states:::lambda:invoke"

        TimeoutSeconds = 30

        Parameters = {

          FunctionName =
            aws_lambda_function.createEmployee.arn

          Payload.$ = "$"
        }

        End = true
      }

      ##################################################
      # UPDATE EMPLOYEE
      ##################################################

      UpdateEmployee = {

        Type = "Task"

        Resource = "arn:aws:states:::lambda:invoke"

        TimeoutSeconds = 30

        Parameters = {

          FunctionName =
            aws_lambda_function.updateEmployee.arn

          Payload.$ = "$"
        }

        End = true
      }

      ##################################################
      # UPLOAD EMPLOYEE IMAGE
      ##################################################

      UploadEmployeeImage = {

        Type = "Task"

        Resource = "arn:aws:states:::lambda:invoke"

        TimeoutSeconds = 30

        Parameters = {

          FunctionName =
            aws_lambda_function.uploadImage.arn

          Payload.$ = "$"
        }

        End = true
      }

      ##################################################
      # UNAUTHORIZED
      ##################################################

      Unauthorized = {

        Type = "Fail"

        Error = "Unauthorized"

        Cause = "JWT token invalid or missing"
      }

      ##################################################
      # INVALID ACTION
      ##################################################

      InvalidAction = {

        Type = "Fail"

        Error = "InvalidAction"

        Cause = "Action must be create/update/upload"
      }
    }
  })
}