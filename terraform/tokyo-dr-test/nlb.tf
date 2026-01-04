# =============================================================================
# Network Load Balancer - DR Tokyo
# =============================================================================

# -----------------------------------------------------------------------------
# NLB (Public Subnet에 배치)
# -----------------------------------------------------------------------------
resource "aws_lb" "nlb" {
  name               = "${var.project_name}-DR-NLB"
  internal           = false
  load_balancer_type = "network"
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_c.id]

  tags = {
    Name = "${var.project_name}-DR-NLB"
  }
}

# -----------------------------------------------------------------------------
# Target Group - App for NLB (TCP Port 3001)
# -----------------------------------------------------------------------------
resource "aws_lb_target_group" "app_nlb" {
  name        = "${var.project_name}-DR-App-NLB-TG"
  port        = 3001
  protocol    = "TCP"
  vpc_id      = aws_vpc.dr.id
  target_type = "instance"

  health_check {
    enabled             = true
    protocol            = "TCP"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    interval            = 30
  }

  tags = {
    Name = "${var.project_name}-DR-App-NLB-TG"
  }
}

# -----------------------------------------------------------------------------
# NLB Listener - TCP (Port 443 → App 3001)
# -----------------------------------------------------------------------------
resource "aws_lb_listener" "nlb_tcp" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = 443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_nlb.arn
  }
}
