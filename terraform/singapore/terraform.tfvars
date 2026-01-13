# =============================================================================
# 변수 값 설정 - Singapore Main Region (V3.0)
# =============================================================================
# ⚠️ 이 파일은 .gitignore에 추가하세요!
# =============================================================================

project_name = "plcr"
region_code  = "se1"
environment  = "prod"
aws_region   = "ap-southeast-1"
aws_profile  = "default"

# VPC CIDR (10.1.0.0/24 사용 - V3.0, 싱가포르 Main Region)
vpc_cidr              = "10.1.0.0/24"
public_subnet_a_cidr  = "10.1.0.0/27"   # 10.1.0.0 ~ 10.1.0.31
public_subnet_c_cidr  = "10.1.0.32/27"  # 10.1.0.32 ~ 10.1.0.63
private_subnet_a_cidr = "10.1.0.64/26"  # 10.1.0.64 ~ 10.1.0.127
private_subnet_c_cidr = "10.1.0.128/26" # 10.1.0.128 ~ 10.1.0.191
# [참고] 여유 CIDR (확장용 Reserved): 10.1.0.192/26 (10.1.0.192 ~ 10.1.0.255)

# EC2 설정
base_ami_id   = "ami-XXXXXXXXX"  # 싱가포르 Amazon Linux 2023 AMI (조회 필요)
instance_type = "t2.medium"

# Auto Scaling
app_asg_min     = 1
app_asg_max     = 4
app_asg_desired = 1

# DynamoDB (참조용 - 이미 생성됨)
dynamodb_table_prefix = "MegaTicket-Hybrid"

# 도메인
domain_name = "pilotlight-test.click"

# GitHub 레포지토리
github_repo = "https://github.com/seolhyebom/megaticket.git"

