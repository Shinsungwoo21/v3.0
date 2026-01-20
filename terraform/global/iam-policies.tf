# =============================================================================
# IAM 공통 보안 정책 (MFA 강제, 자가 관리)
# =============================================================================

# -----------------------------------------------------------------------------
# MFA 강제 정책 (모든 그룹에 적용)
# -----------------------------------------------------------------------------
locals {
  all_groups = [
    aws_iam_group.admin.name,
    aws_iam_group.operation.name,
    aws_iam_group.developer.name,
    aws_iam_group.customer_readonly.name
  ]
}

resource "aws_iam_group_policy" "require_mfa" {
  for_each = toset(local.all_groups)

  name   = "require-mfa"
  group  = each.value
  policy = file("${path.module}/policies/require_mfa.json")
}

# -----------------------------------------------------------------------------
# 사용자 자가 관리 정책 (모든 그룹에 적용)
# -----------------------------------------------------------------------------
resource "aws_iam_group_policy" "self_mgmt" {
  for_each = toset(local.all_groups)

  name   = "self-management"
  group  = each.value
  policy = file("${path.module}/policies/self_mgmt.json")
}

# -----------------------------------------------------------------------------
# IAM Account Password Policy
# -----------------------------------------------------------------------------
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 10
  require_lowercase_characters   = true
  require_uppercase_characters   = true
  require_numbers               = true
  require_symbols               = true
  allow_users_to_change_password = true
  max_password_age              = 90
  password_reuse_prevention     = 5
}
