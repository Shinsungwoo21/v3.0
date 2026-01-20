# =============================================================================
# Outputs
# =============================================================================

output "admin_group_arn" {
  description = "admin 그룹 ARN"
  value       = aws_iam_group.admin.arn
}

output "operation_group_arn" {
  description = "operation 그룹 ARN"
  value       = aws_iam_group.operation.arn
}

output "developer_group_arn" {
  description = "developer 그룹 ARN"
  value       = aws_iam_group.developer.arn
}

output "customer_readonly_group_arn" {
  description = "customer-readonly 그룹 ARN"
  value       = aws_iam_group.customer_readonly.arn
}

output "password_policy_expire_passwords" {
  description = "패스워드 만료 설정"
  value       = aws_iam_account_password_policy.strict.expire_passwords
}
