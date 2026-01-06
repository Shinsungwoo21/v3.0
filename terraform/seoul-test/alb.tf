# =============================================================================
# Application Load Balancer - Seoul Test
# =============================================================================

# -----------------------------------------------------------------------------
# ALB (Public Subnet에 배치)
# -----------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.project_name}-ALB"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_c.id]

  tags = {
    Name = "${var.project_name}-ALB"
  }
}

# -----------------------------------------------------------------------------
# Target Group - Web (Port 3000)
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "web" {
  name     = "${var.project_name}-Web-TG"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }

  tags = {
    Name = "${var.project_name}-Web-TG"
  }
}

# -----------------------------------------------------------------------------
# ALB Listener - HTTP (Port 80) → HTTPS 리다이렉트
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# -----------------------------------------------------------------------------
# ALB Listener - HTTPS (Port 443)
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# -----------------------------------------------------------------------------
# ⚠️ ALB App TG 및 API 리스너 규칙 제거됨
# -----------------------------------------------------------------------------
# Next.js rewrites로 /api/* 요청이 INTERNAL_API_URL (NLB)로 프록시됨
# 따라서 ALB에서 직접 App으로 전달할 필요 없음
# App은 NLB를 통해서만 접근 가능 (Web → NLB → App)
# -----------------------------------------------------------------------------
