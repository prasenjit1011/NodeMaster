resource "aws_sfn_state_machine" "employee_flow" {

  name     = "employee-flow"
  role_arn = aws_iam_role.step_function_role.arn

  definition = templatefile(
    "${path.module}/../stepfunction/employee-flow.json",
    {
      validateJwtArn   = aws_lambda_function.validateJwt.arn
      createEmployeeArn = aws_lambda_function.createEmployee.arn
      uploadImageArn   = aws_lambda_function.uploadImage.arn
      updateEmployeeArn = aws_lambda_function.updateEmployee.arn
    }
  )
}