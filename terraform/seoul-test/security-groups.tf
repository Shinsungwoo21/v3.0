# =============================================================================
# Security Groups - Seoul Test
# =============================================================================

# -----------------------------------------------------------------------------
# ALB Security Group
# -----------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-ALB-SG"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ALB-SG"
  }
}

# -----------------------------------------------------------------------------
# NLB Security Group (NLB는 보안 그룹이 없지만 대상 그룹용으로 정의)
# -----------------------------------------------------------------------------
# NLB 자체는 Security Group을 사용하지 않음
# 대신 App 인스턴스에서 NLB 트래픽을 허용해야 함

# -----------------------------------------------------------------------------
# Web Instance Security Group (Private Subnet)
# -----------------------------------------------------------------------------
resource "aws_security_group" "web" {
  name        = "${var.project_name}-Web-SG"
  description = "Security group for Web instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Web Port from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # SSM Session Manager용 아웃바운드
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-Web-SG"
  }
}

# -----------------------------------------------------------------------------
# App Instance Security Group (Private Subnet)
# -----------------------------------------------------------------------------
resource "aws_security_group" "app" {
  name        = "${var.project_name}-App-SG"
  description = "Security group for App instances"
  vpc_id      = aws_vpc.main.id

  # ALB에서 오는 API 요청
  ingress {
    description     = "API Port from ALB"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Web 인스턴스에서 오는 내부 API 요청
  ingress {
    description     = "API Port from Web instances"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # NLB에서 오는 트래픽 (NLB는 클라이언트 IP를 유지하므로 VPC CIDR 허용)
  ingress {
    description = "API Port from NLB (VPC CIDR)"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-App-SG"
  }
}
