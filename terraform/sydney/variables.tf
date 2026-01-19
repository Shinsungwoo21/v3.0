# =============================================================================
# Variables - Sydney DR Region (V3.0 PLCR)
# =============================================================================

# -----------------------------------------------------------------------------
# 기본 설정
# -----------------------------------------------------------------------------
variable "project_name" {
  type    = string
  default = "plcr"
}

variable "region_code" {
  type    = string
  default = "apse2"
}

variable "environment" {
  type    = string
  default = "dr"
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-2"
}

# -----------------------------------------------------------------------------
# VPC 
# -----------------------------------------------------------------------------
variable "vpc_cidr" {
  type    = string
  default = "10.2.0.0/24"
}

variable "public_subnet_a_cidr" {
  type    = string
  default = "10.2.0.0/27"
}

variable "public_subnet_b_cidr" {
  type    = string
  default = "10.2.0.32/27"
}

variable "private_subnet_a_cidr" {
  type    = string
  default = "10.2.0.64/26"
}

variable "private_subnet_b_cidr" {
  type    = string
  default = "10.2.0.128/26"
}

# -----------------------------------------------------------------------------
# EC2 - AMI 설정
# -----------------------------------------------------------------------------
variable "golden_ami_id" {
  type        = string
  description = "Golden AMI ID (빈 값이면 Amazon Linux 2023 자동 조회)"
  default     = ""
}

variable "instance_type" {
  type    = string
  default = "t2.medium"
}

# -----------------------------------------------------------------------------
# Auto Scaling 설정 (App - Pilot Light: desired=0)
# -----------------------------------------------------------------------------
variable "app_asg_min" {
  type = number
}

variable "app_asg_max" {
  type = number
}

variable "app_asg_desired" {
  type = number
}

# -----------------------------------------------------------------------------
# DynamoDB 
# -----------------------------------------------------------------------------
variable "dynamodb_table_prefix" {
  type    = string
  default = "MegaTicket-Hybrid"
}

# -----------------------------------------------------------------------------
# 도메인 설정
# -----------------------------------------------------------------------------
variable "domain_name" {
  type    = string
  default = "megaticket.click"
}

variable "route53_zone_id" {
  type    = string
  default = "Z02745862QYUFMC87Y6RJ"
}

# -----------------------------------------------------------------------------
# S3 아티팩트 설정 (CRR 복제 버킷)
# -----------------------------------------------------------------------------
variable "artifact_bucket" {
  type        = string
  description = "S3 bucket for build artifacts (CRR replicated)"
}

variable "artifact_key" {
  type        = string
  description = "S3 key for app artifact zip"
  default     = "app/app-artifact.zip"
}
