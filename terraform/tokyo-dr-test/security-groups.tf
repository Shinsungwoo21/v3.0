# =============================================================================
# Security Groups - DR Tokyo
# =============================================================================

# -----------------------------------------------------------------------------
# ALB Security Group
# -----------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-DR-ALB-SG"
  description = "Security group for DR Application Load Balancer"
  vpc_id      = aws_vpc.dr.id

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
    Name = "${var.project_name}-DR-ALB-SG"
  }
}

# -----------------------------------------------------------------------------
# Web Instance Security Group (Private Subnet)
# -----------------------------------------------------------------------------
resource "aws_security_group" "web" {
  name        = "${var.project_name}-DR-Web-SG"
  description = "Security group for DR Web instances"
  vpc_id      = aws_vpc.dr.id

  ingress {
    description     = "Web Port from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-DR-Web-SG"
  }
}

# -----------------------------------------------------------------------------
# App Instance Security Group (Private Subnet)
# -----------------------------------------------------------------------------
resource "aws_security_group" "app" {
  name        = "${var.project_name}-DR-App-SG"
  description = "Security group for DR App instances"
  vpc_id      = aws_vpc.dr.id

  ingress {
    description     = "API Port from ALB"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "API Port from Web instances"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # NLB에서 오는 트래픽
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
    Name = "${var.project_name}-DR-App-SG"
  }
}
