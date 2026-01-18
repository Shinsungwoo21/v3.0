# =============================================================================
# PLCR Infrastructure - Sydney DR Region (V3.0)
# =============================================================================
# Web: S3 정적 호스팅 (CRR 복제)
# App: EC2 ASG + ALB (Pilot Light: desired=0)
# 배포: S3 아티팩트 직접 배포 (CodeDeploy 없음)
# =============================================================================

terraform {
  required_version = ">= 1.0.0"

  # 로컬 상태 파일 사용 (backend 없음)
  # terraform.tfstate가 로컬에 생성됨
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# VPC
# -----------------------------------------------------------------------------
resource "aws_vpc" "dr" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${var.region_code}"
  }
}

# -----------------------------------------------------------------------------
# Internet Gateway
# -----------------------------------------------------------------------------
resource "aws_internet_gateway" "dr" {
  vpc_id = aws_vpc.dr.id

  tags = {
    Name = "${var.project_name}-igw-${var.region_code}"
  }
}

# -----------------------------------------------------------------------------
# Subnets - Public (ALB 배치용)
# -----------------------------------------------------------------------------
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = var.public_subnet_a_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-sbn-${var.region_code}-a-pub"
    Tier = "pub"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = var.public_subnet_b_cidr
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-sbn-${var.region_code}-b-pub"
    Tier = "pub"
  }
}

# -----------------------------------------------------------------------------
# Subnets - Private (App EC2 인스턴스 배치용)
# -----------------------------------------------------------------------------
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.private_subnet_a_cidr
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.project_name}-sbn-${var.region_code}-a-pri"
    Tier = "pri"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.private_subnet_b_cidr
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "${var.project_name}-sbn-${var.region_code}-b-pri"
    Tier = "pri"
  }
}

# -----------------------------------------------------------------------------
# Route Tables
# -----------------------------------------------------------------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.dr.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dr.id
  }

  tags = {
    Name = "${var.project_name}-rt-${var.region_code}-pub"
    Tier = "pub"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.dr.id

  lifecycle {
    ignore_changes = [
      route
    ]
  }

  tags = {
    Name = "${var.project_name}-rt-${var.region_code}-pri"
    Tier = "pri"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}

# -----------------------------------------------------------------------------
# VPC Endpoints (Gateway)
# -----------------------------------------------------------------------------
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.dr.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "${var.project_name}-vpce-${var.region_code}-dynamodb"
  }
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.dr.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAccessToArtifactBucket"
        Effect    = "Allow"
        Principal = "*" 
        Action    = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.artifact_bucket}",
          "arn:aws:s3:::${var.artifact_bucket}/*"
        ]
      },
      {
        Sid       = "AllowAmazonLinuxRepo"
        Effect    = "Allow"
        Principal = "*"
        Action    = [
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::al2023-repos-*/*",
          "arn:aws:s3:::amazonlinux-*/*"
        ]
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-vpce-${var.region_code}-s3"
  }
}

# -----------------------------------------------------------------------------
# VPC Endpoints (Interface)
# -----------------------------------------------------------------------------
locals {
  interface_services = {
    "ssm"             = "ssm"     
    "ssmmessages"     = "ssmmessages"  
    "ec2messages"     = "ec2messages" 
    "bedrock"         = "bedrock"
    "bedrock-runtime" = "bedrock-runtime"
  }
}

resource "aws_vpc_endpoint" "interface" {
  for_each = local.interface_services

  vpc_id            = aws_vpc.dr.id
  service_name      = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_endpoint_type = "Interface"

  subnet_ids = [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id
  ]

  security_group_ids  = [aws_security_group.vpce.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-vpce-${var.region_code}-${each.key}"
  }
}

# -----------------------------------------------------------------------------
# ALB TG
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "app" {
  name     = "${var.project_name}-tg-app-${var.region_code}"
  port     = 3001
  protocol = "HTTP"
  vpc_id   = aws_vpc.dr.id

  health_check {
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name = "${var.project_name}-tg-${var.region_code}-app"
    Tier = "app"
  }
}
