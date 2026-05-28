resource "aws_sfn_state_machine" "employee_flow" {
  name     = "employee-flow"
  role_arn = aws_iam_role.step_function_role.arn

  definition = file("../stepfunction/employee-flow.json")
}
