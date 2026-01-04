# =============================================================================
# Route 53 - Seoul Test
# =============================================================================

# -----------------------------------------------------------------------------
# A Record - ALB로 연결 (기존 CloudFront 레코드 대체)
# -----------------------------------------------------------------------------
resource "aws_route53_record" "main" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
