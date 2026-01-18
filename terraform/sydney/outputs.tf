# =============================================================================
# Outputs - Sydney DR Region (V3.0)
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.dr.id
}

output "public_subnet_ids" {
  description = "Public Subnet IDs"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

output "private_subnet_ids" {
  description = "Private Subnet IDs"
  value       = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

output "alb_dns_name" {
  description = "ALB DNS Name"
  value       = aws_lb.dr.dns_name
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = aws_lb.dr.zone_id
}

output "asg_name" {
  description = "App Auto Scaling Group Name"
  value       = aws_autoscaling_group.app.name
}

output "ami_id" {
  description = "사용된 Amazon Linux 2023 AMI ID"
  value       = data.aws_ami.amazon_linux_2023.id
}

output "target_group_arn" {
  description = "App Target Group ARN"
  value       = aws_lb_target_group.app.arn
}
