# =============================================================================
# 변수 값 설정 - Sydney DR Region (V3.0)
# =============================================================================
# ⚠️ 이 파일은 .gitignore에 추가하세요!
# =============================================================================

project_name = "plcr"
region_code  = "se2"
environment  = "dr"
aws_region   = "ap-southeast-2"
aws_profile  = "default"

# VPC CIDR (10.1.1.0/24 사용 - V3.0, 시드니 DR Region)
vpc_cidr              = "10.1.1.0/24"
public_subnet_a_cidr  = "10.1.1.0/27"   # 10.1.1.0 ~ 10.1.1.31
public_subnet_c_cidr  = "10.1.1.32/27"  # 10.1.1.32 ~ 10.1.1.63
private_subnet_a_cidr = "10.1.1.64/26"  # 10.1.1.64 ~ 10.1.1.127
private_subnet_c_cidr = "10.1.1.128/26" # 10.1.1.128 ~ 10.1.1.191
# [참고] 여유 CIDR (확장용 Reserved): 10.1.1.192/26 (10.1.1.192 ~ 10.1.1.255)

# EC2 설정 (시드니 리전)
key_pair_name = "megaticket-sydney"  # 생성 필요
instance_type = "t2.medium"
base_ami_id   = "ami-XXXXXXXXX"  # 시드니 AMI (조회 필요)

# Auto Scaling (Pilot Light - 평시 0, DR 시 scale up)
app_asg_min     = 0
app_asg_max     = 0
app_asg_desired = 0

# DynamoDB (참조용 - Global Table은 싱가포르에서 관리)
dynamodb_table_prefix = "MegaTicket-Hybrid"

# 도메인
domain_name = "pilotlight-test.click"

