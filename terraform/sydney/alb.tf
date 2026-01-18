# =============================================================================
# ALB - Sydney DR Region (V3.0)
# =============================================================================
# HTTP:80 전용 (ACM 인증서 없음)
# =============================================================================

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------
resource "aws_lb" "dr" {
  name               = "${var.project_name}-alb-${var.region_code}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "${var.project_name}-alb-${var.region_code}"
    Tier = "alb"
  }
}

# -----------------------------------------------------------------------------
# HTTP Listener (Port 80) - ACM 없음
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.dr.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
