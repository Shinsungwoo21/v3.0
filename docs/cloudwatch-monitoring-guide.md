# MegaTicket Chatbot - CloudWatch 모니터링 가이드

> **Version**: V8.1 | **Last Updated**: 2026-01-04

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MegaTicket Chatbot (Next.js)                     │
│                                                                         │
│  ┌───────────────────────┐     ┌───────────────────────────────────┐   │
│  │   route.ts            │     │   CloudWatch Integration          │   │
│  │   (API Handler)       │────▶│   (EMF: Embedded Metric Format)   │   │
│  └───────────────────────┘     └───────────────────────────────────┘   │
│           │                                  │                          │
│           ▼                                  ▼                          │
│  ┌───────────────────────┐     ┌───────────────────────────────────┐   │
│  │   Bedrock Runtime     │     │   console.log(JSON)               │   │
│  │   (Claude Models)     │     │   ↓                               │   │
│  └───────────────────────┘     │   CloudWatch Logs                 │   │
│                                │   ↓                               │   │
│                                │   CloudWatch Metrics (Auto)       │   │
│                                └───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. EMF (Embedded Metric Format) 방식

### 2.1 EMF란?

EMF는 AWS에서 권장하는 메트릭 수집 방식으로, **로그에 메트릭 정보를 태깅**하여 CloudWatch가 자동으로 추출합니다.

### 2.2 기존 방식 vs EMF 방식

| 항목 | 기존 (`PutMetricData`) | EMF (현재) |
|------|------------------------|------------|
| **API 호출** | 매 요청마다 별도 HTTP 요청 | ❌ 없음 |
| **네트워크 오버헤드** | ✅ 있음 (추가 Latency) | ❌ 없음 |
| **비용** | Custom Metric API 호출 비용 | 로그 수집 비용만 |
| **에러 핸들링** | try-catch 필요 | 불필요 (로그는 항상 성공) |
| **구현 복잡도** | SDK 의존성 필요 | `console.log` 한 줄 |

### 2.3 EMF JSON 구조

```javascript
{
  // ═══════════════════════════════════════
  // 1️⃣ 애플리케이션 컨텍스트 (디버깅용)
  // ═══════════════════════════════════════
  "service": "MegaTicket-Chatbot",
  "event": "BedrockInvokeSuccess",

  // ═══════════════════════════════════════
  // 2️⃣ Dimension 값 (메트릭 분류 기준)
  //    - 반드시 최상위 레벨에 위치
  //    - CloudWatchMetrics.Dimensions 이름과 매칭
  // ═══════════════════════════════════════
  "Model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
  "IsFallback": false,

  // ═══════════════════════════════════════
  // 3️⃣ Metric 값 (측정할 수치)
  //    - 반드시 최상위 레벨에 위치
  //    - CloudWatchMetrics.Metrics 이름과 매칭
  // ═══════════════════════════════════════
  "Latency": 1234,
  "InputTokens": 500,
  "OutputTokens": 200,

  // ═══════════════════════════════════════
  // 4️⃣ _aws 메타데이터 (CloudWatch 파싱용)
  // ═══════════════════════════════════════
  "_aws": {
    "Timestamp": 1735313554000,  // Unix milliseconds
    "CloudWatchMetrics": [{
      "Namespace": "MegaTicket/Bedrock",
      "Dimensions": [
        ["Model"],                    // 단일 Dimension 조합
        ["Model", "IsFallback"]       // 복합 Dimension 조합
      ],
      "Metrics": [
        { "Name": "Latency", "Unit": "Milliseconds" },
        { "Name": "InputTokens", "Unit": "Count" },
        { "Name": "OutputTokens", "Unit": "Count" }
      ]
    }]
  }
}
```

---

## 3. 구현된 메트릭

### 3.1 메트릭 목록

| 메트릭 이름 | 단위 | 설명 | Dimensions |
|------------|------|------|------------|
| `Latency` | Milliseconds | Bedrock 응답 시간 (스트림 완료까지) | Model, IsFallback |
| `InputTokens` | Count | 입력 토큰 수 | Model, IsFallback |
| `OutputTokens` | Count | 출력 토큰 수 | Model, IsFallback |
| `FallbackCount` | Count | Fallback 발생 횟수 | Reason |

### 3.2 Namespace 구조

```
CloudWatch > Metrics > Custom Namespaces > MegaTicket/Bedrock
├── Latency
│   ├── [Model]
│   └── [Model, IsFallback]
├── InputTokens
│   ├── [Model]
│   └── [Model, IsFallback]
├── OutputTokens
│   ├── [Model]
│   └── [Model, IsFallback]
└── FallbackCount
    └── [Reason]
```

---

## 4. 코드 구현

### 4.1 성공 로그 (`BedrockInvokeSuccess`)

**위치**: `apps/app/app/api/chat/route.ts` (라인 202-224)

> ⚠️ **현재 상태**: 테스트 비용 절감을 위해 **주석처리됨** (V8.1)

```typescript
// [TEST MODE] CloudWatch EMF 메트릭 비활성화 - 프로덕션 배포 시 주석 해제
/*
console.log(JSON.stringify({
  service: "MegaTicket-Chatbot",
  event: "BedrockInvokeSuccess",
  Model: usedModel,
  IsFallback: isFallback,
  Latency: latencyMs,
  InputTokens: usage.inputTokens,
  OutputTokens: usage.outputTokens,
  _aws: {
    Timestamp: Date.now(),
    CloudWatchMetrics: [{ ... }]
  }
}));
*/
```

### 4.2 Fallback 로그 (`FallbackTriggered`)

**위치**: `apps/app/app/api/chat/route.ts` (라인 282-301)

> ⚠️ **현재 상태**: 테스트 비용 절감을 위해 **주석처리됨** (V8.1)

```typescript
// [TEST MODE] Fallback EMF 메트릭 비활성화 - 프로덕션 배포 시 주석 해제
/*
console.warn(JSON.stringify({
  service: "MegaTicket-Chatbot",
  event: "FallbackTriggered",
  Reason: e.name || "Unknown",
  FallbackCount: 1,
  _aws: { CloudWatchMetrics: [{ ... }] }
}));
*/
```

---

## 5. 테스트 모드 설정 (V8.1)

### 5.1 현재 상태

테스트 비용 절감을 위해 아래 로그들이 **주석처리**되어 있습니다:

| 파일 | 라인 | 이벤트 | 상태 |
|------|------|--------|------|
| `route.ts` | L204-224 | `BedrockInvokeSuccess` | ⏸️ 주석처리 |
| `route.ts` | L252-253 | `[ToolSuccess]` | ⏸️ 주석처리 |
| `route.ts` | L283-303 | `FallbackTriggered` | ⏸️ 주석처리 |
| `route.ts` | L357-366 | `PromptComposed` | ⏸️ 주석처리 |
| `route.ts` | L49-56 | `BedrockInvokeError` | ✅ **활성화 유지** |

### 5.2 프로덕션 배포 시 활성화

`route.ts` 파일에서 `[TEST MODE]` 주석을 찾아 블록 주석(`/* ... */`)을 해제합니다:

```typescript
// [TEST MODE] CloudWatch EMF 메트릭 비활성화 - 프로덕션 배포 시 주석 해제
// /* ← 이 줄과
console.log(JSON.stringify({ ... }));
// */ ← 이 줄을 삭제
```

### 5.3 비용 절감 효과

| 상태 | 예상 비용/월 |
|------|-------------|
| 모든 로그 활성화 | ~$20-50 |
| 테스트 모드 (현재) | ~$1-3 |
| **절감액** | **~$20-45** |

---

## 6. AWS 인프라 관점

### 6.1 데이터 플로우

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Next.js App    │      │  CloudWatch Logs │      │CloudWatch Metrics│
│                  │      │                  │      │                  │
│  console.log()   │─────▶│  Log Group       │─────▶│  Custom Metrics  │
│  (EMF JSON)      │      │  /aws/eb/...     │      │  MegaTicket/     │
│                  │      │                  │      │  Bedrock         │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                               │                           │
                               ▼                           ▼
                          Log Insights               CloudWatch Alarms
                          (쿼리/분석)                 (임계치 알림)
```

### 6.2 자동 메트릭 추출 원리

1. 애플리케이션이 `console.log(JSON.stringify(emfObject))`로 로그 출력
2. CloudWatch Logs Agent가 로그 수집
3. CloudWatch가 `_aws` 필드 감지
4. `CloudWatchMetrics` 스펙에 따라 자동 메트릭 생성
5. 지정된 Namespace에 Dimensions와 함께 저장

### 6.3 IAM 권한 요구사항

EMF 방식은 **추가 IAM 권한이 필요 없습니다**:

```json
// 기존에 필요했던 권한 (제거됨)
{
  "Effect": "Allow",
  "Action": [
    "cloudwatch:PutMetricData"  // ← EMF에서는 불필요
  ],
  "Resource": "*"
}

// EMF에서 필요한 권한 (애플리케이션 로깅용, 기본 포함)
{
  "Effect": "Allow",
  "Action": [
    "logs:CreateLogStream",
    "logs:PutLogEvents"
  ],
  "Resource": "arn:aws:logs:*:*:log-group:/aws/elasticbeanstalk/*"
}
```

---

## 7. 모니터링 대시보드 구성 예시

### 7.1 CloudWatch Dashboard 위젯

```yaml
Dashboard: MegaTicket-Bedrock-Monitoring
Widgets:
  - Title: "Average Latency by Model"
    Type: Line
    Metric: MegaTicket/Bedrock:Latency
    Stat: Average
    Period: 300
    
  - Title: "Token Usage (Input/Output)"
    Type: Stacked Area
    Metrics:
      - MegaTicket/Bedrock:InputTokens (Sum)
      - MegaTicket/Bedrock:OutputTokens (Sum)
    
  - Title: "Fallback Rate"
    Type: Number
    Metric: MegaTicket/Bedrock:FallbackCount
    Stat: Sum
    Period: 3600
```

### 7.2 알람 설정 예시

```yaml
Alarms:
  - Name: "High Fallback Rate"
    Metric: MegaTicket/Bedrock:FallbackCount
    Threshold: 10
    Period: 300
    EvaluationPeriods: 2
    Action: SNS Topic (DevOps Alert)
    
  - Name: "High Latency"
    Metric: MegaTicket/Bedrock:Latency
    Threshold: 10000  # 10초
    Period: 60
    Action: SNS Topic (DevOps Alert)
```

---

## 8. 로그 분석 (CloudWatch Logs Insights)

### 8.1 유용한 쿼리

```sql
-- 평균 Latency 및 토큰 사용량 (시간별)
fields @timestamp, Latency, InputTokens, OutputTokens, Model
| filter event = "BedrockInvokeSuccess"
| stats avg(Latency) as AvgLatency, 
        sum(InputTokens) as TotalInput, 
        sum(OutputTokens) as TotalOutput 
  by bin(1h)
```

```sql
-- Fallback 발생 현황
fields @timestamp, Reason, primaryModel, fallbackModel, statusCode
| filter event = "FallbackTriggered"
| stats count() as FallbackCount by Reason
| sort FallbackCount desc
```

```sql
-- 모델별 비용 추정 (Claude 기준)
fields @timestamp, Model, InputTokens, OutputTokens
| filter event = "BedrockInvokeSuccess"
| stats sum(InputTokens) * 0.000003 + sum(OutputTokens) * 0.000015 as EstimatedCost by Model
```

---

## 9. 트러블슈팅

### 9.1 메트릭이 생성되지 않는 경우

| 증상 | 원인 | 해결 |
|------|------|------|
| CloudWatch에 메트릭 없음 | `_aws` 필드 오타 | JSON 구조 검증 |
| Dimension 값 누락 | 최상위 필드 누락 | 필드명과 Dimensions 이름 일치 확인 |
| 로그는 있는데 메트릭 없음 | Timestamp 형식 오류 | Unix ms 사용 확인 |

### 9.2 로컬 테스트

로컬에서는 CloudWatch 연동 없이 터미널에서 로그만 확인 가능:

```bash
npm run dev
# 챗봇 대화 후 터미널 출력 확인
# 아래 필드 포함 여부 체크:
# - InputTokens, OutputTokens
# - _aws.CloudWatchMetrics
```

---

## 10. 참고 자료

- [AWS EMF 공식 문서](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html)
- [EMF Best Practices](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Manual.html)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
