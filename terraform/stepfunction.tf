resource "aws_sfn_state_machine" "employee_flow" {

  name     = "employee-flow"

  role_arn = aws_iam_role.step_function_role.arn

  definition = jsonencode({

    Comment = "Employee System Workflow"

    StartAt = "ValidateJWT"

    States = {

      ValidateJWT = {
        Type = "Task"
        Resource =
          aws_lambda_function.validateJwt.arn
        Next = "CreateEmployee"
      }

      CreateEmployee = {
        Type = "Task"
        Resource =
          aws_lambda_function.createEmployee.arn
        Next = "UploadImage"
      }

      UploadImage = {
        Type = "Task"
        Resource =
          aws_lambda_function.uploadImage.arn
        Next = "UpdateEmployee"
      }

      UpdateEmployee = {
        Type = "Task"
        Resource =
          aws_lambda_function.updateEmployee.arn
        End = true
      }
    }
  })
}