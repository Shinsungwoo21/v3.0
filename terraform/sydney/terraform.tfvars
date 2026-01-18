# =============================================================================
# 변수 값 설정 - Sydney DR Region (V3.0 PLCR)
# =============================================================================
# ⚠️ 이 파일은 .gitignore에 추가하세요!
# =============================================================================

project_name = "plcr"
region_code  = "apse2"
environment  = "dr"
aws_region   = "ap-southeast-2"

# VPC CIDR (10.2.0.0/24 사용 - V3.0, 시드니 DR Region)
vpc_cidr              = "10.2.0.0/24"
public_subnet_a_cidr  = "10.2.0.0/27"   # 10.2.0.0 ~ 10.2.0.31
public_subnet_b_cidr  = "10.2.0.32/27"  # 10.2.0.32 ~ 10.2.0.63
private_subnet_a_cidr = "10.2.0.64/26"  # 10.2.0.64 ~ 10.2.0.127
private_subnet_b_cidr = "10.2.0.128/26" # 10.2.0.128 ~ 10.2.0.191
# 여유 CIDR (확장용 Reserved): 10.2.0.192/26 (10.2.0.192 ~ 10.2.0.255)

# EC2 - AMI는 data source로 자동 조회
instance_type = "t2.medium"

# Auto Scaling (Pilot Light - 평시 0, DR 시 scale up)
app_asg_min     = 0
app_asg_max     = 4
app_asg_desired = 0

# DynamoDB (Global Table)
dynamodb_table_prefix = "MegaTicket-Hybrid"

# 도메인
domain_name = "megaticket.click"

# S3 아티팩트 버킷 (CRR로 복제된 시드니 버킷)
artifact_bucket = "codepipeline-ap-southeast-2-artifacts"
artifact_key    = "app/app-artifact.zip"
