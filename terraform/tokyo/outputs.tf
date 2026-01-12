# =============================================================================
# Outputs - Tokyo DR Region (V3.0)
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.dr.id
}

output "app_asg_name" {
  description = "App Auto Scaling Group Name"
  value       = aws_autoscaling_group.app.name
}

output "private_subnet_ids" {
  description = "Private Subnet IDs"
  value       = [aws_subnet.private_a.id, aws_subnet.private_c.id]
}

output "public_subnet_ids" {
  description = "Public Subnet IDs"
  value       = [aws_subnet.public_a.id, aws_subnet.public_c.id]
}

output "ec2_iam_role_arn" {
  description = "EC2 IAM Role ARN"
  value       = aws_iam_role.ec2_role.arn
}

output "app_security_group_id" {
  description = "App Security Group ID"
  value       = aws_security_group.app.id
}
