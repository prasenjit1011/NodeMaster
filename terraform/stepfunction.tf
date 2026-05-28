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

        Resource = aws_lambda_function.validateJwt.arn

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

        Resource = aws_lambda_function.uploadImage.arn

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