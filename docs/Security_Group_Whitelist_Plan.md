# 🔐 보안 그룹 화이트리스트 방식 전환 - 분석 및 수정 계획서

작성일: 2026-01-09
작성자: 설혜봄

---

## 📋 1. 현황 분석

### 1.1 기존 보안 그룹 구성 (서울/도쿄 동일)

| 보안 그룹 | Ingress | Egress |
|-----------|---------|--------|
| ALB-SG | 80, 443 (0.0.0.0/0) | **전체 개방** (0.0.0.0/0) |
| Web-SG | 3000 (ALB-SG) | **전체 개방** (0.0.0.0/0) |
| App-SG | 3001 (ALB-SG, Web-SG, VPC CIDR) | **전체 개방** (0.0.0.0/0) |

### 1.2 현재 VPC Endpoint 상태

| Endpoint | 유형 | 상태 |
|----------|------|------|
| DynamoDB | Gateway | ✅ 존재 |
| SSM (ssm, ssmmessages, ec2messages) | Interface | ❌ 없음 |
| Bedrock Runtime | Interface | ❌ 없음 |

---

## 🔍 2. 제안된 수정 코드 분석

### 2.1 ALB Security Group

```hcl
egress {
  description     = "To Web instances"
  from_port       = 3000
  to_port         = 3000
  protocol        = "tcp"
  security_groups = [aws_security_group.web.id]
}
```

> ✅ **분석 결과: 적절함**
> - ALB는 오직 Web 인스턴스(3000)로만 트래픽을 전달하면 됨
> - 보안 그룹 ID 참조 방식으로 정확히 타겟 지정

---

### 2.2 Web Security Group

```hcl
# Egress 1: App 인스턴스로 API 호출 (NLB 경유)
egress {
  description = "To App via NLB (VPC CIDR)"
  from_port   = 3001
  to_port     = 3001
  protocol    = "tcp"
  cidr_blocks = [var.vpc_cidr]
}

# Egress 2: HTTPS (SSM, npm, GitHub 등)
egress {
  description = "HTTPS to AWS Services and Internet"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # ⚠️ 여전히 전체 개방
}

# Egress 3: HTTP (yum 패키지 다운로드)
egress {
  description = "HTTP for package downloads"
  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # ⚠️ 여전히 전체 개방
}
```

> ⚠️ **분석 결과: 개선 필요**
>
> **문제점:**
> 1. HTTPS/HTTP egress에 `0.0.0.0/0` 사용 → 화이트리스트 방식 목표와 불일치
> 2. SSM VPC Endpoint 미구성 시 SSM Session Manager 작동 불가
> 3. 빌드 완료 후 NAT GW 연결 삭제 계획 → **SSM 접근 불가 위험**

---

### 2.3 App Security Group

```hcl
# Egress 1: HTTPS (DynamoDB, Bedrock, SSM, npm)
egress {
  description = "HTTPS to AWS Services and Internet"
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # ⚠️ 여전히 전체 개방
}

# Egress 2: HTTP (yum 패키지 다운로드)
egress {
  description = "HTTP for package downloads"
  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # ⚠️ 여전히 전체 개방
}
```

> ⚠️ **분석 결과: 개선 필요**
>
> **문제점:**
> 1. App 인스턴스의 핵심 기능인 **Bedrock API 호출**을 위해 VPC Interface Endpoint 필요
> 2. `0.0.0.0/0` 유지 시 화이트리스트 방식의 실효성 저하

---

## 🚨 3. 핵심 이슈: VPC Endpoint 부재

> ⛔ **심각한 문제: NAT Gateway 삭제 시 서비스 중단 위험**
>
> 주석에 "서비스 정상 동작 확인 후 NAT GW 연결 삭제"라고 명시되어 있지만, 현재 VPC Endpoint가 충분히 구성되지 않아 NAT GW 삭제 시 다음 서비스가 중단됩니다:

| 서비스 | 현재 상태 | NAT GW 삭제 시 |
|--------|----------|----------------|
| DynamoDB | Gateway Endpoint ✅ | ✅ 정상 |
| SSM Session Manager | Endpoint 없음 ❌ | ❌ 인스턴스 접근 불가 |
| Bedrock API | Endpoint 없음 ❌ | ❌ AI 기능 중단 |
| CloudWatch Logs | Endpoint 없음 ❌ | ❌ 로그 수집 불가 |

---

## ✨ 4. 권장 수정 사항

### 4.1 Phase 1: VPC Interface Endpoint 추가 (필수)

NAT Gateway 삭제 전 반드시 다음 Endpoint를 추가해야 합니다:

**추가해야 할 Endpoint 목록:**
- `com.amazonaws.{region}.ssm`
- `com.amazonaws.{region}.ssmmessages`
- `com.amazonaws.{region}.ec2messages`
- `com.amazonaws.{region}.bedrock-runtime`
- `com.amazonaws.{region}.logs`

**VPC Endpoints용 Security Group:**
```hcl
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-VPCEndpoints-SG"
  description = "Security group for VPC Endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "${var.project_name}-VPCEndpoints-SG"
  }
}
```

---

### 4.2 Phase 2: 보안 그룹 수정 (VPC Endpoint 배포 후)

**최종 권장 Egress 설정:**

| 보안 그룹 | Egress 대상 | 포트 | 방식 |
|-----------|-------------|------|------|
| ALB-SG | Web-SG | 3000 | Security Group ID |
| Web-SG | VPC CIDR (NLB 경유) | 3001 | CIDR |
| Web-SG | VPCEndpoints-SG | 443 | Security Group ID |
| App-SG | VPCEndpoints-SG | 443 | Security Group ID |

---

## ❓ 5. NLB 보안 그룹 질문에 대한 답변

> 💡 **NLB는 보안 그룹을 지원하지 않습니다**
>
> Network Load Balancer는 Layer 4에서 동작하며, ALB와 달리 자체 보안 그룹이 없습니다.
> 대신 **타겟(App 인스턴스)의 보안 그룹**에서 NLB 트래픽을 제어합니다.

```hcl
# 현재 App-SG의 NLB 관련 Ingress (이미 존재) ✅
ingress {
  description = "API Port from NLB (VPC CIDR)"
  from_port   = 3001
  protocol    = "tcp"
  cidr_blocks = [var.vpc_cidr]  # NLB는 IP를 보존하므로 VPC CIDR 사용
}
```

**결론:** NLB 보안 그룹은 생성하지 않아도 됩니다.

---

## 📅 6. 배포 전략 및 주의사항

### 6.1 배포 순서

```
Phase 1: VPC Endpoints 배포
    ↓
Phase 2: Endpoint 연결 테스트
    ↓
Phase 3: 보안 그룹 수정
    ↓
Phase 4: NAT Gateway 삭제
```

### 6.2 롤백 계획

| 단계 | 문제 발생 시 롤백 방법 |
|------|------------------------|
| Phase 1 | Endpoint 삭제 (비용 중단) |
| Phase 2 | 테스트 실패 시 진행 중단 |
| Phase 3 | 보안 그룹 egress를 0.0.0.0/0으로 복원 |
| Phase 4 | NAT Gateway 재생성 |

### 6.3 비용 고려사항

> 💰 **VPC Interface Endpoint 비용 (서울 리전 기준)**
> - 시간당 약 $0.014/endpoint × 5개 = $0.07/시간
> - 월간 약 **$50.40** (24시간 × 30일 기준)
> - 데이터 처리 비용: GB당 $0.01
>
> NAT Gateway 비용 ($0.059/시간 + 데이터 비용)과 비교하여 판단 필요

---

## ✅ 7. 검증 계획

### 7.1 자동화 테스트

```bash
# SSM Session Manager 연결 테스트
aws ssm start-session --target <instance-id>

# Bedrock API 연결 테스트 (인스턴스 내부에서)
curl -X POST https://bedrock-runtime.ap-northeast-2.amazonaws.com/...

# DynamoDB 연결 테스트
aws dynamodb scan --table-name KDT-Msp4-PLDR-concertTable --max-items 1
```

### 7.2 수동 검증 체크리스트

- [ ] ALB → Web 인스턴스(3000) 통신 확인
- [ ] Web → App 인스턴스(3001 via NLB) 통신 확인
- [ ] App → DynamoDB (Gateway Endpoint) 통신 확인
- [ ] App → Bedrock (Interface Endpoint) 통신 확인
- [ ] SSM Session Manager 연결 확인 (Web, App 모두)

---

## 📊 8. 결론 및 권장사항

### 8.1 현재 제안 코드 평가

| 항목 | 평가 | 설명 |
|------|------|------|
| ALB Egress 제한 | ✅ 적절 | Web-SG로만 제한, 이상 없음 |
| Web/App NLB 통신 | ✅ 적절 | VPC CIDR 방식 적절 |
| HTTPS/HTTP Egress | ⚠️ 개선 필요 | 0.0.0.0/0 유지는 화이트리스트 목표에 부합하지 않음 |
| VPC Endpoint 고려 | ❌ 누락 | SSM, Bedrock Endpoint 추가 필수 |

### 8.2 최종 권장사항

1. ✅ **VPC Interface Endpoint 먼저 배포** (SSM, Bedrock, CloudWatch Logs)
2. ✅ **보안 그룹 Egress를 VPC Endpoint SG로 제한**
3. ✅ **NAT Gateway 삭제는 모든 테스트 완료 후 진행**
4. ✅ **서울/도쿄 양쪽 리전에 동일하게 적용**

---

## 🙋 9. 멘토님께 확인이 필요한 사항

1. **VPC Interface Endpoint 비용** (월 약 $50) 승인 여부
2. **빌드 전용 NAT Gateway 운영 전략** (임시 생성/삭제 vs. 상시 운영)
3. **Cross-Region Inference 사용 시** Global Endpoint 접근 방식 (추가 고려 필요)

---

*이 문서는 서울/도쿄 리전 모두에 적용됩니다.*
