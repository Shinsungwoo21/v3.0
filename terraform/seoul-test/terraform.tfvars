# =============================================================================
# 변수 값 설정 - Seoul Test (GoldenAMI 생성용)
# =============================================================================
# ⚠️ 이 파일은 .gitignore에 추가하세요!
# =============================================================================

project_name = "MegaTicket"
environment  = "test"
aws_region   = "ap-northeast-2"
aws_profile  = "default"

# VPC CIDR (기존 10.0.0.0/16 VPC와 충돌 방지)
vpc_cidr              = "10.100.0.0/16"
public_subnet_a_cidr  = "10.100.0.0/26"
public_subnet_c_cidr  = "10.100.0.64/26"
private_subnet_a_cidr = "10.100.16.0/20"
private_subnet_c_cidr = "10.100.32.0/20"

# EC2 설정
key_pair_name = "seungwan_seoul"
base_ami_id   = "ami-0b818a04bc9c2133c"  # Amazon Linux 2023 AMI 2023.9.20251208.0 x86_64 HVM kernel-6.1
instance_type = "t2.medium"

# Auto Scaling (테스트용 - 각 1개)
web_asg_min     = 1
web_asg_max     = 1
web_asg_desired = 1

app_asg_min     = 1
app_asg_max     = 1
app_asg_desired = 1

# DynamoDB (참조용 - 이미 생성됨)
dynamodb_table_prefix = "KDT-Msp4-PLDR"

# 도메인
domain_name = "pilotlight-test.click"

# GitHub 레포지토리
github_repo = "https://github.com/seolhyebom/megaticket.git"
