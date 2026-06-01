resource "aws_sfn_state_machine" "leave_workflow" {
  name     = "employeeLeaveWorkflow"
  role_arn = aws_iam_role.stepfn_role.arn

  type = "EXPRESS"

  definition = jsonencode({
    Comment = "Employee Leave Approval Workflow"

    StartAt = "ValidateLeave"

    States = {

      ValidateLeave = {
        Type     = "Task"
        Resource = aws_lambda_function.validate_leave.arn
        Next     = "CreateLeave"
      }

      CreateLeave = {
        Type     = "Task"
        Resource = aws_lambda_function.create_leave.arn
        Next     = "ManagerApproval"
      }

      ManagerApproval = {
        Type     = "Task"
        Resource = aws_lambda_function.manager_approval.arn
        Next     = "HRApproval"
      }

      HRApproval = {
        Type     = "Task"
        Resource = aws_lambda_function.hr_approval.arn
        Next     = "UpdateBalance"
      }

      UpdateBalance = {
        Type     = "Task"
        Resource = aws_lambda_function.update_balance.arn
        Next     = "SendEmail"
      }

      SendEmail = {
        Type     = "Task"
        Resource = aws_lambda_function.send_email.arn
        End      = true
      }
    }
  })
}

# ==========================================
# OUTPUTS
# ==========================================

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}