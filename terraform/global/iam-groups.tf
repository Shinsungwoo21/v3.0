# =============================================================================
# IAM User Groups - 4개 핵심 그룹
# =============================================================================

# -----------------------------------------------------------------------------
# 1. admin 그룹
# -----------------------------------------------------------------------------
resource "aws_iam_group" "admin" {
  name = "admin"
  path = "/"
}

resource "aws_iam_group_policy_attachment" "admin_full_access" {
  group      = aws_iam_group.admin.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# -----------------------------------------------------------------------------
# 2. operation 그룹
# -----------------------------------------------------------------------------
resource "aws_iam_group" "operation" {
  name = "operation"
  path = "/"
}

resource "aws_iam_group_policy" "operation_policy" {
  name   = "operation-permissions"
  group  = aws_iam_group.operation.name
  policy = file("${path.module}/policies/operation.json")
}

# -----------------------------------------------------------------------------
# 3. developer 그룹
# -----------------------------------------------------------------------------
resource "aws_iam_group" "developer" {
  name = "developer"
  path = "/"
}

resource "aws_iam_group_policy" "developer_policy" {
  name   = "developer-permissions"
  group  = aws_iam_group.developer.name
  policy = file("${path.module}/policies/developer.json")
}

# -----------------------------------------------------------------------------
# 4. customer-readonly 그룹
# -----------------------------------------------------------------------------
resource "aws_iam_group" "customer_readonly" {
  name = "customer-readonly"
  path = "/"
}

resource "aws_iam_group_policy" "customer_readonly_policy" {
  name   = "customer-readonly-permissions"
  group  = aws_iam_group.customer_readonly.name
  policy = file("${path.module}/policies/customer_readonly.json")
}
