# =============================================================================
# MegaTicket Infrastructure - DR Tokyo Region (GoldenAMI 테스트용)
# =============================================================================
# 목적: 서울 리전에서 복사한 GoldenAMI를 사용하여 DR 테스트
# DB는 Global Table로 자동 복제되므로 생성하지 않음
# =============================================================================

terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
  
  default_tags {
    tags = {
      Project     = "MegaTicket"
      Environment = "${var.environment}-DR"
      ManagedBy   = "Terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# VPC (Main과 다른 CIDR 사용: 10.1.0.0/16)
# -----------------------------------------------------------------------------
resource "aws_vpc" "dr" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-DR-VPC"
  }
}

# -----------------------------------------------------------------------------
# Internet Gateway
# -----------------------------------------------------------------------------
resource "aws_internet_gateway" "dr" {
  vpc_id = aws_vpc.dr.id

  tags = {
    Name = "${var.project_name}-DR-IGW"
  }
}

# -----------------------------------------------------------------------------
# Subnets - Public (ALB, NLB, NAT Gateway 배치용)
# -----------------------------------------------------------------------------
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = var.public_subnet_a_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-DR-Public-Subnet-A"
    Type = "Public"
  }
}

resource "aws_subnet" "public_c" {
  vpc_id                  = aws_vpc.dr.id
  cidr_block              = var.public_subnet_c_cidr
  availability_zone       = "${var.aws_region}c"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-DR-Public-Subnet-C"
    Type = "Public"
  }
}

# -----------------------------------------------------------------------------
# Subnets - Private (Web, App EC2 인스턴스 배치용)
# -----------------------------------------------------------------------------
resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.private_subnet_a_cidr
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.project_name}-DR-Private-Subnet-A"
    Type = "Private"
  }
}

resource "aws_subnet" "private_c" {
  vpc_id            = aws_vpc.dr.id
  cidr_block        = var.private_subnet_c_cidr
  availability_zone = "${var.aws_region}c"

  tags = {
    Name = "${var.project_name}-DR-Private-Subnet-C"
    Type = "Private"
  }
}

# -----------------------------------------------------------------------------
# NAT Gateway (Private Subnet → 인터넷 접근용)
# -----------------------------------------------------------------------------
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-DR-NAT-EIP"
  }
}

resource "aws_nat_gateway" "dr" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id

  tags = {
    Name = "${var.project_name}-DR-NAT-GW"
  }

  depends_on = [aws_internet_gateway.dr]
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
    Name = "${var.project_name}-DR-Public-RT"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.dr.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dr.id
  }

  tags = {
    Name = "${var.project_name}-DR-Private-RT"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_c" {
  subnet_id      = aws_subnet.public_c.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_c" {
  subnet_id      = aws_subnet.private_c.id
  route_table_id = aws_route_table.private.id
}

# -----------------------------------------------------------------------------
# VPC Endpoints (Gateway - 무료)
# -----------------------------------------------------------------------------
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.dr.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = {
    Name = "${var.project_name}-DR-DynamoDB-Endpoint"
  }
}
