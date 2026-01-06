# =============================================================================
# Network Load Balancer - DR Tokyo
# =============================================================================
# ⚠️ NLB는 Terraform이 아닌 Step Function에서 동적으로 생성됩니다.
# 
# Step Function DR Failover 프로세스:
# 1. GoldenAMI 복사 (Seoul → Tokyo)
# 2. NLB + Target Group 생성
# 3. Launch Template 업데이트 (NLB DNS 주입)
# 4. ASG에 Target Group 연결
# 5. ASG Desired Capacity 증가
# 
# NLB 생성 코드는 Step Function에 포함되어 있습니다.
# =============================================================================
