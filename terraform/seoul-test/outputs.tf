# =============================================================================
# Outputs - Seoul Test
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "ALB DNS Name"
  value       = aws_lb.main.dns_name
}

output "nlb_dns_name" {
  description = "NLB DNS Name"
  value       = aws_lb.nlb.dns_name
}

output "web_asg_name" {
  description = "Web Auto Scaling Group Name"
  value       = aws_autoscaling_group.web.name
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

output "web_security_group_id" {
  description = "Web Security Group ID"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "App Security Group ID"
  value       = aws_security_group.app.id
}

# =============================================================================
# GoldenAMI 생성 후 확인용 정보
# =============================================================================
output "instructions" {
  description = "다음 단계 안내"
  value       = <<-EOT
    
    ============================================================
    서울 리전 인프라가 생성되었습니다!
    ============================================================
    
    1. ALB DNS로 접속하여 서비스 동작 확인:
       http://${aws_lb.main.dns_name}
    
    2. API 헬스체크:
       http://${aws_lb.main.dns_name}/api/health
    
    3. 인스턴스 상태 확인 (SSM으로 접속):
       - pm2 list
       - pm2 logs
    
    4. GoldenAMI 생성:
       - EC2 콘솔 → 인스턴스 선택 → 작업 → 이미지 및 템플릿 → 이미지 생성
       - Web AMI: MegaTicket-Web-GoldenAMI-YYYYMMDD
       - App AMI: MegaTicket-App-GoldenAMI-YYYYMMDD
    
    5. AMI를 도쿄 리전으로 복사:
       - EC2 → AMI → 선택 → 작업 → AMI 복사 → 대상 리전: ap-northeast-1
    
    ============================================================
  EOT
}
