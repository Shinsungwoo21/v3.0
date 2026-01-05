# =============================================================================
# Variables - Seoul Test (GoldenAMI 생성용)
# =============================================================================

# -----------------------------------------------------------------------------
# 기본 설정
# -----------------------------------------------------------------------------
variable "project_name" {
  description = "프로젝트 이름 (리소스 Name 태그 접두사)"
  type        = string
  default     = "MegaTicket"
}

variable "environment" {
  description = "환경 (dev/staging/prod)"
  type        = string
  default     = "test"
}

variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "aws_profile" {
  description = "AWS CLI 프로파일 이름"
  type        = string
  default     = "default"  # ryuseungwan 사용자
}

# -----------------------------------------------------------------------------
# VPC 설정
# -----------------------------------------------------------------------------
variable "vpc_cidr" {
  description = "VPC CIDR 블록"
  type        = string
  default     = "10.100.0.0/16"
}

variable "public_subnet_a_cidr" {
  description = "Public Subnet A CIDR (ALB, NAT용 - 작게)"
  type        = string
  default     = "10.100.0.0/26"  # 64 IPs
}

variable "public_subnet_c_cidr" {
  description = "Public Subnet C CIDR (ALB, NAT용 - 작게)"
  type        = string
  default     = "10.100.0.64/26"  # 64 IPs
}

variable "private_subnet_a_cidr" {
  description = "Private Subnet A CIDR (EC2용 - 크게)"
  type        = string
  default     = "10.100.16.0/20"  # 4096 IPs
}

variable "private_subnet_c_cidr" {
  description = "Private Subnet C CIDR (EC2용 - 크게)"
  type        = string
  default     = "10.100.32.0/20"  # 4096 IPs
}

# -----------------------------------------------------------------------------
# EC2 설정
# -----------------------------------------------------------------------------
variable "key_pair_name" {
  description = "EC2 SSH 키 페어 이름 (SSM 사용 시 불필요)"
  type        = string
  default     = "seungwan_seoul"
}

variable "base_ami_id" {
  description = "기본 AMI ID (Amazon Linux 2023)"
  type        = string
  default     = "ami-0b818a04bc9c2133c"  # Amazon Linux 2023 AMI 2023.9.20251208.0 x86_64 HVM kernel-6.1
}

variable "instance_type" {
  description = "EC2 인스턴스 타입"
  type        = string
  default     = "t2.medium"  # 테스트용 medium
}

# -----------------------------------------------------------------------------
# Auto Scaling 설정
# -----------------------------------------------------------------------------
variable "web_asg_min" {
  description = "Web ASG 최소 인스턴스"
  type        = number
  default     = 1
}

variable "web_asg_max" {
  description = "Web ASG 최대 인스턴스"
  type        = number
  default     = 3
}

variable "web_asg_desired" {
  description = "Web ASG 희망 인스턴스"
  type        = number
  default     = 1  # 테스트용 1개
}

variable "app_asg_min" {
  description = "App ASG 최소 인스턴스"
  type        = number
  default     = 1
}

variable "app_asg_max" {
  description = "App ASG 최대 인스턴스"
  type        = number
  default     = 3
}

variable "app_asg_desired" {
  description = "App ASG 희망 인스턴스"
  type        = number
  default     = 1  # 테스트용 1개
}

# -----------------------------------------------------------------------------
# DynamoDB 설정 (참조용 - 테이블은 생성하지 않음)
# -----------------------------------------------------------------------------
variable "dynamodb_table_prefix" {
  description = "DynamoDB 테이블 접두사 (IAM 정책용)"
  type        = string
  default     = "KDT-Msp4-PLDR"
}

# -----------------------------------------------------------------------------
# 도메인 설정
# -----------------------------------------------------------------------------
variable "domain_name" {
  description = "Route 53 호스팅 영역 도메인"
  type        = string
  default     = "pilotlight-test.click"
}

variable "route53_zone_id" {
  description = "Route 53 호스팅 영역 ID"
  type        = string
  default     = "Z0853952ATBTQYQZAMXB"
}

variable "acm_certificate_arn" {
  description = "ACM SSL 인증서 ARN"
  type        = string
  default     = "arn:aws:acm:ap-northeast-2:626614672806:certificate/56b9d39f-fd74-4296-9982-ea14bfc20c78"
}

# -----------------------------------------------------------------------------
# GitHub 레포지토리
# -----------------------------------------------------------------------------
variable "github_repo" {
  description = "소스 코드 GitHub 레포지토리 URL"
  type        = string
  default     = "https://github.com/seolhyebom/megaticket.git"
}
