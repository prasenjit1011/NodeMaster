resource "aws_sfn_state_machine" "faq" {
  name     = "faq-state-machine"
  role_arn = aws_iam_role.step_fn_role.arn

  definition = jsonencode({
    StartAt = "Validate",
    States = {
      Validate = {
        Type = "Task",
        Resource = aws_lambda_function.validate.arn,
        Next = "DBLookup"
      },

      DBLookup = {
        Type = "Task",
        Resource = aws_lambda_function.dbLookup.arn,
        Next = "CheckFound"
      },

      CheckFound = {
        Type = "Choice",
        Choices = [{
          Variable = "$.found",
          BooleanEquals = true,
          Next = "ReturnFound"
        }],
        Default = "Fallback"
      },

      ReturnFound = {
        Type = "Pass",
        End = true
      },

      Fallback = {
        Type = "Task",
        Resource = aws_lambda_function.fallback.arn,
        Next = "Store"
      },

      Store = {
        Type = "Task",
        Resource = aws_lambda_function.store.arn,
        End = true
      }
    }
  })
}