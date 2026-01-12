# MegaTicket DR 트러블슈팅 & 복구 가이드

본 문서는 MegaTicket 프로젝트의 DR(Disaster Recovery) 환경에서 자주 발생하는 문제들의 증상, 원인, 해결법을 정리한 가이드입니다.

---

## 목차

1. [환경변수 주입 트러블슈팅](#1-환경변수-주입-트러블슈팅)
2. [Golden AMI 관련](#2-golden-ami-관련)
3. [Launch Template 관련](#3-launch-template-관련)
4. [API 프록시 관련](#4-api-프록시-관련)
5. [DR 전환 시 체크리스트](#5-dr-전환-시-체크리스트)
6. [자주 발생한 에러 & 해결법](#6-자주-발생한-에러--해결법)
7. [DR 자동화 파이프라인 트러블슈팅](#7-dr-자동화-파이프라인-트러블슈팅)

---

## 1. 환경변수 주입 트러블슈팅

### 1.1 Next.js 빌드 시점 vs 런타임 환경변수

> [!CAUTION]
> 이것이 DR 환경에서 **가장 많이 발생하는 문제의 근본 원인**입니다.

| 구분 | 빌드 시점 (Build-time) | 런타임 (Runtime) |
|:---|:---|:---|
| **적용 시점** | `npm run build` 실행 시 | 서버 시작 시 (`npm start`) |
| **환경변수 접두사** | `NEXT_PUBLIC_*` | `NEXT_PUBLIC_` 없는 변수들 |
| **번들링** | JS 코드에 하드코딩됨 | `process.env`에서 읽음 |
| **DR 영향** | ⚠️ 서울 AMI에 서울 값이 고정됨 | ✅ User Data로 변경 가능 |

#### 증상
- Golden AMI를 도쿄에서 사용했는데 API 호출이 서울 NLB로 감
- 환경변수를 변경했는데 반영이 안 됨
- `.env.production` 파일을 수정해도 적용 안 됨

#### 원인
Next.js의 `next.config.ts`에서 `rewrites()`를 사용하면, 빌드 시점에 destination URL이 고정됩니다.

```typescript
// ❌ 잘못된 방식 - 빌드 시점에 값이 고정됨
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.INTERNAL_API_URL}/api/:path*`, // 빌드 시 값 고정!
    },
  ];
}
```

#### 해결법
**Route Handler 방식**을 사용하여 런타임에 환경변수를 읽습니다.

파일 위치: `apps/web/app/api/[...path]/route.ts`

```typescript
async function proxyRequest(request: NextRequest, params: { path: string[] }) {
    // ✅ 런타임에 환경변수 읽기
    const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3001';
    
    const apiPath = params.path.join('/');
    const targetUrl = `${INTERNAL_API_URL}/api/${apiPath}`;
    
    // ... fetch 로직
}
```

---

### 1.2 INTERNAL_API_URL 주입 실패

#### 증상
- 웹 → 앱 API 호출이 `localhost:3001` 또는 서울 NLB DNS로 잘못 감
- 502 Bad Gateway 또는 ECONNREFUSED 에러

#### 체크포인트

```bash
# 1. .env.production 파일 확인
cat /home/ec2-user/megaticket/apps/web/.env.production

# 예상 출력 (도쿄):
# AWS_REGION=ap-northeast-1
# INTERNAL_API_URL=http://MegaTicket-DR-NLB-xxx.elb.ap-northeast-1.amazonaws.com:3001

# 2. PM2 환경변수 확인
pm2 env web-frontend

# 3. 실제 API 호출 테스트
curl http://localhost:3000/api/health
```

#### 해결법

**방법 1: PM2 환경변수 인라인 주입 (권장)**

```bash
# 기존 프로세스 삭제
pm2 delete web-frontend

# 환경변수를 명시적으로 주입하여 시작
AWS_REGION=ap-northeast-1 \
INTERNAL_API_URL=http://MegaTicket-DR-NLB-xxx.elb.ap-northeast-1.amazonaws.com:3001 \
pm2 start npm --name 'web-frontend' -- start

pm2 save
```

**방법 2: .env.production 덮어쓰기**

```bash
# User Data에서 Golden AMI의 .env.production을 덮어쓰기
cat > /home/ec2-user/megaticket/apps/web/.env.production << 'ENVEOF'
AWS_REGION=ap-northeast-1
INTERNAL_API_URL=http://MegaTicket-DR-NLB-xxx.elb.ap-northeast-1.amazonaws.com:3001
ENVEOF

# PM2 재시작
pm2 restart web-frontend
```

> [!IMPORTANT]
> **두 방법을 함께 사용하세요!** `.env.production` 덮어쓰기 + PM2 인라인 주입을 모두 적용하는 것이 가장 안전합니다.

---

### 1.3 AWS_REGION 설정 이슈

#### 증상
- DynamoDB 호출이 잘못된 리전으로 감
- Bedrock API 호출 실패
- 헬스체크에서 리전 정보가 잘못 표시됨

#### 체크포인트

```bash
# App 서버 환경변수 확인
pm2 env app-backend | grep AWS_REGION

# DynamoDB 연결 테스트 (EC2에서)
aws dynamodb describe-table --table-name KDT-Msp4-PLDR-performances --region ap-northeast-1
```

#### 해결법 (App Backend)

```bash
# PM2 인라인 주입
AWS_REGION=ap-northeast-1 \
PORT=3001 \
DYNAMODB_RESERVATIONS_TABLE=KDT-Msp4-PLDR-reservations \
DYNAMODB_PERFORMANCES_TABLE=KDT-Msp4-PLDR-performances \
DYNAMODB_VENUES_TABLE=KDT-Msp4-PLDR-venues \
DYNAMODB_SCHEDULES_TABLE=KDT-Msp4-PLDR-schedules \
pm2 start npm --name 'app-backend' -- start
```

---

### 1.4 User Data에서 환경변수 주입 완전 예제

**Web 인스턴스 (`user_data_web.sh`):**

```bash
#!/bin/bash
set -x
exec > >(tee /var/log/user-data.log) 2>&1
echo "=== DR Web User Data Started: $(date) ==="

# 1. 쉘 환경변수 파일 생성
echo "export AWS_REGION=${aws_region}" > /home/ec2-user/dr-web-env.sh
echo "export INTERNAL_API_URL=${internal_api_url}" >> /home/ec2-user/dr-web-env.sh
chown ec2-user:ec2-user /home/ec2-user/dr-web-env.sh

# 2. .env.production 덮어쓰기 (Golden AMI 설정 무시)
sudo -u ec2-user bash -c "cat > /home/ec2-user/megaticket/apps/web/.env.production << 'ENVEOF'
AWS_REGION=${aws_region}
INTERNAL_API_URL=${internal_api_url}
ENVEOF"

# 3. PM2 재시작 - 환경변수 인라인 주입
sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && pm2 delete web-frontend || true'
sudo -u ec2-user bash -c "source \$HOME/.nvm/nvm.sh && cd \$HOME/megaticket/apps/web && \
AWS_REGION=${aws_region} INTERNAL_API_URL=${internal_api_url} \
pm2 start npm --name 'web-frontend' -- start"
sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && pm2 save'

echo "=== DR Web User Data Completed: $(date) ==="
```

**App 인스턴스 (`user_data_app.sh`):**

```bash
#!/bin/bash
set -x
exec > >(tee /var/log/user-data.log) 2>&1
echo "=== DR App User Data Started: $(date) ==="

# 1. 쉘 환경변수 파일 생성
echo "export AWS_REGION=${aws_region}" > /home/ec2-user/dr-env.sh
echo "export PORT=3001" >> /home/ec2-user/dr-env.sh
echo "export DYNAMODB_RESERVATIONS_TABLE=${dynamodb_table_prefix}-reservations" >> /home/ec2-user/dr-env.sh
echo "export DYNAMODB_PERFORMANCES_TABLE=${dynamodb_table_prefix}-performances" >> /home/ec2-user/dr-env.sh
echo "export DYNAMODB_VENUES_TABLE=${dynamodb_table_prefix}-venues" >> /home/ec2-user/dr-env.sh
echo "export DYNAMODB_SCHEDULES_TABLE=${dynamodb_table_prefix}-schedules" >> /home/ec2-user/dr-env.sh
echo "export DR_RECOVERY_MODE=true" >> /home/ec2-user/dr-env.sh
chown ec2-user:ec2-user /home/ec2-user/dr-env.sh

# 2. .env.production 덮어쓰기
sudo -u ec2-user bash -c "cat > /home/ec2-user/megaticket/apps/app/.env.production << 'ENVEOF'
AWS_REGION=${aws_region}
PORT=3001
DYNAMODB_RESERVATIONS_TABLE=${dynamodb_table_prefix}-reservations
DYNAMODB_PERFORMANCES_TABLE=${dynamodb_table_prefix}-performances
DYNAMODB_VENUES_TABLE=${dynamodb_table_prefix}-venues
DYNAMODB_SCHEDULES_TABLE=${dynamodb_table_prefix}-schedules
DR_RECOVERY_MODE=true
ENVEOF"

# 3. PM2 재시작 - 환경변수 인라인 주입
sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && pm2 delete app-backend || true'
sudo -u ec2-user bash -c "source /home/ec2-user/dr-env.sh && source \$HOME/.nvm/nvm.sh && \
cd \$HOME/megaticket/apps/app && \
AWS_REGION=${aws_region} PORT=3001 \
DYNAMODB_RESERVATIONS_TABLE=${dynamodb_table_prefix}-reservations \
DYNAMODB_PERFORMANCES_TABLE=${dynamodb_table_prefix}-performances \
DYNAMODB_VENUES_TABLE=${dynamodb_table_prefix}-venues \
DYNAMODB_SCHEDULES_TABLE=${dynamodb_table_prefix}-schedules \
pm2 start npm --name 'app-backend' -- start"
sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && pm2 save'

echo "=== DR App User Data Completed: $(date) ==="
```

---

## 2. Golden AMI 관련

### 2.1 AMI에 포함되어야 하는 항목

| 항목 | 설명 |
|:---|:---|
| ✅ 빌드된 소스 코드 | `npm run build` 완료 상태 |
| ✅ Node.js & NVM | 런타임 환경 |
| ✅ PM2 | 프로세스 매니저 |
| ✅ 기본 .env 파일 | 빌드 시점에 필요했던 설정 (DR에서 덮어씀) |
| ✅ `standalone` 빌드 결과물 | `.next/standalone` 디렉토리 |

### 2.2 User Data로 주입해야 하는 항목

| 항목 | Web | App |
|:---|:---:|:---:|
| `AWS_REGION` | ✅ | ✅ |
| `INTERNAL_API_URL` | ✅ | ❌ |
| `PORT` | ❌ | ✅ |
| `DYNAMODB_*_TABLE` | ❌ | ✅ |
| `DR_RECOVERY_MODE` | ❌ | ✅ |

### 2.3 서울 AMI → 도쿄 사용 시 주의점

> [!WARNING]
> 서울에서 생성한 Golden AMI를 그대로 도쿄에서 사용하면 빌드 시점에 고정된 값들이 문제를 일으킵니다.

| 문제 | 원인 | 해결 |
|:---|:---|:---|
| API 호출이 서울로 감 | `rewrites()`에 서울 NLB DNS가 하드코딩됨 | Route Handler 방식 사용 |
| 리전 배지가 서울로 표시 | `NEXT_PUBLIC_AWS_REGION` 빌드 시 고정 | `/api/health`에서 런타임 리전 반환 |
| DynamoDB 연결 실패 | `AWS_REGION` 잘못 설정 | User Data에서 인라인 주입 |

**AMI 복사 명령어:**

```bash
# 서울에서 도쿄로 AMI 복사
aws ec2 copy-image \
    --source-image-id ami-xxxxxxxxx \
    --source-region ap-northeast-2 \
    --region ap-northeast-1 \
    --name "MegaTicket-Golden-AMI-DR" \
    --description "서울에서 복사한 DR용 Golden AMI"
```

---

## 3. Launch Template 관련

### 3.1 버전 관리 주의사항

> [!IMPORTANT]
> ASG는 Launch Template의 **특정 버전** 또는 `$Latest`를 참조합니다.

| 설정 | 동작 |
|:---|:---|
| `$Latest` | 항상 가장 최신 버전 사용 (⚠️ 예상치 못한 변경 발생 가능) |
| `$Default` | 기본 버전으로 설정된 버전 사용 |
| 특정 버전 번호 | 해당 버전만 사용 (안정적) |

**현재 버전 확인:**

```bash
aws ec2 describe-launch-template-versions \
    --launch-template-name MegaTicket-DR-Web-LT \
    --versions '$Latest'
```

### 3.2 User Data Placeholder 치환 방식

Terraform에서 `user_data.sh`에 placeholder를 사용하고, Step Function에서 실제 값으로 치환합니다.

**Terraform `user_data`:**
```hcl
user_data = base64encode(templatefile("${path.module}/user_data_web.sh", {
  aws_region       = "ap-northeast-1"
  internal_api_url = "http://NLB_DNS_PLACEHOLDER:3001"  # 실제 NLB DNS로 치환됨
}))
```

**Step Function에서 치환:**
```python
# NLB_DNS_PLACEHOLDER를 실제 NLB DNS로 교체
updated_user_data = current_user_data.replace(
    "NLB_DNS_PLACEHOLDER",
    nlb_dns  # 예: MegaTicket-DR-NLB-xxx.elb.ap-northeast-1.amazonaws.com
)
```

### 3.3 Step Function에서 최신 버전 참조

```python
# 최신 버전의 Launch Template 데이터 조회
version_response = ec2.describe_launch_template_versions(
    LaunchTemplateId=lt_id,
    Versions=["$Latest"]
)

# 새 버전 생성 후 ASG 업데이트
ec2.create_launch_template_version(
    LaunchTemplateId=lt_id,
    LaunchTemplateData=new_lt_data,
    VersionDescription=f"Updated NLB DNS: {nlb_dns}"
)
```

### 3.4 PLACEHOLDER 버전 불일치 문제 (실제 사례)

> [!CAUTION]
> 이것은 **실제로 발생했던 문제**입니다. Terraform apply 시 새 버전이 생성되면서 Step Function이 잘못된 버전을 참조하게 됩니다.

#### 증상
- Web → App API 호출 실패 (ECONNREFUSED, 502)
- EC2 인스턴스의 `INTERNAL_API_URL`에 잘못된 NLB DNS가 설정됨
- Step Function 실행해도 NLB DNS가 치환되지 않음

#### 원인
- Step2 Lambda가 `Versions=['2']`를 참조
- 버전 '2'에는 `NLB_DNS_PLACEHOLDER`가 없음 (하드코딩된 DNS)
- PLACEHOLDER가 있는 버전은 '7' 또는 '8'

```
Launch Template 버전 이력:
├─ Version 1: 최초 생성 (하드코딩)
├─ Version 2: Terraform apply (하드코딩)  ← Step2가 참조
├─ ...
├─ Version 7: PLACEHOLDER 추가됨  ← 실제 치환 대상
└─ Version 8: 최신 버전
```

#### 확인 방법

**PowerShell (버전별 PLACEHOLDER 존재 여부 확인):**

```powershell
# 버전별 PLACEHOLDER 존재 여부 확인
foreach ($v in 1..11) {
    $ud = (aws ec2 describe-launch-template-versions `
        --launch-template-id <LT_ID> `
        --versions $v `
        --region ap-northeast-1 `
        --query "LaunchTemplateVersions[0].LaunchTemplateData.UserData" `
        --output text 2>$null)
    if ($ud) {
        $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($ud))
        if ($decoded -match "PLACEHOLDER") {
            Write-Host "버전 $v: ✅ PLACEHOLDER 있음"
        } else {
            Write-Host "버전 $v: ❌ PLACEHOLDER 없음"
        }
    }
}
```

**Bash (Linux/Mac):**

```bash
for v in $(seq 1 11); do
    ud=$(aws ec2 describe-launch-template-versions \
        --launch-template-id <LT_ID> \
        --versions $v \
        --region ap-northeast-1 \
        --query "LaunchTemplateVersions[0].LaunchTemplateData.UserData" \
        --output text 2>/dev/null)
    if [ -n "$ud" ]; then
        decoded=$(echo "$ud" | base64 -d)
        if echo "$decoded" | grep -q "PLACEHOLDER"; then
            echo "버전 $v: ✅ PLACEHOLDER 있음"
        else
            echo "버전 $v: ❌ PLACEHOLDER 없음"
        fi
    fi
done
```

#### 해결 방법

**Step2 Lambda 코드 수정:**

```python
# 변경 전 (잘못된 버전 참조)
version_response = ec2.describe_launch_template_versions(
    LaunchTemplateId=lt_id,
    Versions=['2']  # ❌ PLACEHOLDER가 없는 버전
)

# 변경 후 (PLACEHOLDER가 있는 버전 참조)
version_response = ec2.describe_launch_template_versions(
    LaunchTemplateId=lt_id,
    Versions=['7']  # ✅ PLACEHOLDER가 있는 버전
)

# 또는 최신 버전 참조 (권장)
version_response = ec2.describe_launch_template_versions(
    LaunchTemplateId=lt_id,
    Versions=['$Latest']  # ✅ 항상 최신 버전
)
```

#### 교훈 및 예방책

| 교훈 | 예방책 |
|:---|:---|
| Terraform apply 할 때마다 새 버전 생성됨 | `$Latest` 버전 참조 사용 |
| 이전 버전에 하드코딩된 값이 남아있음 | 버전 생성 시 PLACEHOLDER 포함 확인 |
| Step Function이 잘못된 버전 참조 가능 | Lambda 코드에서 버전 번호 하드코딩 금지 |

---

## 4. API 프록시 관련

### 4.1 Route Handler 방식 설명

**경로:** `apps/web/app/api/[...path]/route.ts`

```
                  ┌─────────────────────────────────────┐
                  │           Web Instance              │
                  │                                     │
Browser ─────────▶│  /api/performances                  │
                  │       │                             │
                  │       ▼                             │
                  │  [Route Handler]                    │
                  │  process.env.INTERNAL_API_URL       │
                  │       │                             │
                  │       ▼                             │
                  │  http://NLB:3001/api/performances   │
                  └───────────────┬─────────────────────┘
                                  │
                                  ▼
                  ┌─────────────────────────────────────┐
                  │           NLB (TCP 3001)            │
                  └───────────────┬─────────────────────┘
                                  │
                                  ▼
                  ┌─────────────────────────────────────┐
                  │           App Instance              │
                  │       /api/performances             │
                  └─────────────────────────────────────┘
```

### 4.2 rewrites() 제거한 이유

| `rewrites()` 방식 | Route Handler 방식 |
|:---|:---|
| ❌ 빌드 시점에 destination 고정 | ✅ 런타임에 환경변수 읽음 |
| ❌ Golden AMI에 값이 하드코딩됨 | ✅ DR에서도 동적으로 변경 가능 |
| ✅ 설정이 간단함 | ⚠️ 코드 작성 필요 |

**next.config.ts에서 rewrites 제거:**
```typescript
const nextConfig: NextConfig = {
  transpilePackages: ['@mega-ticket/shared-types', '@mega-ticket/shared-utils'],
  // rewrites()는 빌드 시점에 고정되므로 제거
  // /api/* 요청은 app/api/[...path]/route.ts에서 런타임 프록시로 처리
};
```

### 4.3 404/307 에러 발생 시 체크포인트

#### 404 Not Found

```bash
# 1. Route Handler 파일 존재 확인
ls -la apps/web/app/api/\[...path\]/route.ts

# 2. 빌드에 포함되었는지 확인
ls -la apps/web/.next/server/app/api/

# 3. App 서버 상태 확인
curl http://localhost:3001/api/health

# 4. NLB 연결 테스트 (Web 인스턴스에서)
curl http://${INTERNAL_API_URL}/api/health
```

#### 307 Temporary Redirect

```bash
# middleware.ts 확인
cat apps/web/src/middleware.ts

# 잘못된 리다이렉트 로직이 있는지 확인
# 특히 특정 경로에서 강제 리다이렉트하는 코드
```

---

## 5. DR 전환 시 체크리스트

### Step 1: 사전 확인

- [ ] **서울 리전 상태 확인**
  - CloudWatch 알람 확인
  - ALB 헬스체크 상태

- [ ] **도쿄 리전 리소스 확인**
  ```bash
  # Terraform 상태 확인
  cd terraform/tokyo-dr-test
  terraform plan
  ```

### Step 2: DR 전환 실행

- [ ] **도쿄 NLB 생성/확인**
  ```bash
  aws elbv2 describe-load-balancers \
      --names MegaTicket-DR-NLB \
      --region ap-northeast-1
  ```

- [ ] **NLB DNS 기록**
  ```
  NLB DNS: ___________________________.elb.ap-northeast-1.amazonaws.com
  ```

- [ ] **Launch Template 업데이트**
  - User Data에 올바른 NLB DNS 확인

- [ ] **ASG 스케일업**
  ```bash
  # App ASG
  aws autoscaling update-auto-scaling-group \
      --auto-scaling-group-name MegaTicket-DR-App-ASG \
      --desired-capacity 1 \
      --region ap-northeast-1
  
  # Web ASG
  aws autoscaling update-auto-scaling-group \
      --auto-scaling-group-name MegaTicket-DR-Web-ASG \
      --desired-capacity 1 \
      --region ap-northeast-1
  ```

### Step 3: 헬스체크 확인

- [ ] **Target Group 헬스체크**
  ```bash
  # App NLB Target Group
  aws elbv2 describe-target-health \
      --target-group-arn <APP_TG_ARN> \
      --region ap-northeast-1
  
  # Web ALB Target Group
  aws elbv2 describe-target-health \
      --target-group-arn <WEB_TG_ARN> \
      --region ap-northeast-1
  ```
  - 모든 타겟이 `healthy` 상태인지 확인

- [ ] **API 헬스체크**
  ```bash
  # App 직접 호출
  curl http://<NLB_DNS>:3001/api/health
  
  # Web을 통한 호출
  curl https://pilotlight-test.click/api/health
  ```

### Step 4: DynamoDB Global Tables 확인

- [ ] **복제 상태 확인**
  ```bash
  aws dynamodb describe-table \
      --table-name KDT-Msp4-PLDR-reservations \
      --region ap-northeast-1 \
      --query 'Table.Replicas'
  ```

- [ ] **데이터 정합성 확인**
  - 최근 예약 데이터가 도쿄에도 있는지 확인

### Step 5: DNS 전환

- [ ] **Route 53 헬스체크 상태**
  - Failover 라우팅 자동 전환 확인
  - 또는 수동으로 레코드 변경

- [ ] **DNS 전파 확인**
  ```bash
  nslookup pilotlight-test.click
  # 도쿄 ALB IP가 반환되는지 확인
  ```

### Step 6: 최종 검증

- [ ] **웹사이트 접속 테스트**
  - 메인 페이지 로딩
  - 리전 배지가 `ap-northeast-1`로 표시

- [ ] **기능 테스트**
  - 좌석 조회
  - 좌석 선점
  - 결제 플로우

---

## 6. 자주 발생한 에러 & 해결법

### 6.1 307 리다이렉트 문제

#### 증상
- 메인 페이지 접속 시 두 번 로딩됨
- 네트워크 탭에서 307 Temporary Redirect 확인

#### 원인
`middleware.ts`에서 조건에 따라 리다이렉트하는 로직

#### 해결법
```typescript
// apps/web/src/middleware.ts

// ❌ 문제가 되는 코드
if (pathname === '/') {
  return NextResponse.redirect(new URL('/performances', request.url));
}

// ✅ 수정된 코드 - 리다이렉트 제거 또는 조건 수정
```

---

### 6.2 middleware.ts 이슈

#### 증상
- 특정 경로에서 예상치 못한 동작
- API 요청이 차단됨

#### 체크포인트
```bash
# middleware.ts 내용 확인
cat apps/web/src/middleware.ts

# matcher 설정 확인
# API 경로가 제외되어 있는지 확인
```

#### 권장 matcher 설정
```typescript
export const config = {
  matcher: [
    // API 경로 제외
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

### 6.3 NLB DNS 불일치 문제

#### 증상
- Web에서 App으로 API 호출 실패
- `ECONNREFUSED` 또는 `timeout` 에러

#### 원인
- User Data의 `INTERNAL_API_URL`이 잘못된 NLB DNS를 가리킴
- Step Function이 최신 NLB DNS로 Launch Template을 업데이트하지 않음

#### 해결법

```bash
# 1. 현재 NLB DNS 확인
aws elbv2 describe-load-balancers \
    --names MegaTicket-DR-NLB \
    --region ap-northeast-1 \
    --query 'LoadBalancers[0].DNSName'

# 2. Web 인스턴스의 환경변수 확인
ssh ec2-user@<WEB_IP>
pm2 env web-frontend | grep INTERNAL_API_URL

# 3. 불일치 시 수동 수정
pm2 delete web-frontend
INTERNAL_API_URL=http://<CORRECT_NLB_DNS>:3001 pm2 start npm --name 'web-frontend' -- start
pm2 save
```

---

### 6.4 IAM 권한 문제

#### 증상
- DynamoDB 호출 시 `AccessDeniedException`
- Bedrock API 호출 실패

#### 체크포인트

```bash
# EC2 인스턴스에 연결된 IAM Role 확인
aws sts get-caller-identity

# DynamoDB 권한 테스트
aws dynamodb scan \
    --table-name KDT-Msp4-PLDR-performances \
    --limit 1 \
    --region ap-northeast-1
```

#### 필요한 IAM 정책

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-northeast-1:*:table/KDT-Msp4-PLDR-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
```

---

### 6.5 PM2 프로세스가 시작되지 않음

#### 증상
- `pm2 list`에 프로세스가 없음
- 서비스 포트(3000, 3001)가 열려있지 않음

#### 체크포인트

```bash
# User Data 로그 확인
cat /var/log/user-data.log

# PM2 로그 확인
pm2 logs web-frontend --lines 50
pm2 logs app-backend --lines 50

# NVM 환경 확인
source ~/.nvm/nvm.sh
node -v
npm -v
```

#### 해결법 (수동 시작)

```bash
# NVM 환경 로드
source ~/.nvm/nvm.sh

# App Backend
cd ~/megaticket/apps/app
pm2 delete app-backend 2>/dev/null || true
AWS_REGION=ap-northeast-1 PORT=3001 pm2 start npm --name 'app-backend' -- start

# Web Frontend  
cd ~/megaticket/apps/web
pm2 delete web-frontend 2>/dev/null || true
AWS_REGION=ap-northeast-1 INTERNAL_API_URL=http://<NLB_DNS>:3001 pm2 start npm --name 'web-frontend' -- start

pm2 save
```

---

### 6.6 standalone 모드(output) 관련 오류

#### 증상
- PM2에서 `Error: Cannot find module` 에러
- `.next/standalone/server.js` 파일이 없음

#### 원인
`next.config.ts`에 `output: 'standalone'` 설정이 없거나 빌드가 제대로 되지 않음

#### 해결법

**next.config.ts 확인:**
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // 이 설정이 있어야 함
  // ...
};
```

**재빌드 (필요 시):**
```bash
cd ~/megaticket/apps/web
npm run build

# 빌드 결과 확인
ls -la .next/standalone/
```

---

## 부록: 빠른 진단 명령어 모음

```bash
# ===== 인스턴스 상태 확인 =====
# PM2 프로세스 상태
pm2 list

# 환경변수 확인
pm2 env web-frontend
pm2 env app-backend

# 포트 리스닝 확인
netstat -tlnp | grep -E '3000|3001'

# ===== 로그 확인 =====
# User Data 로그
cat /var/log/user-data.log

# PM2 로그
pm2 logs --lines 100

# ===== 네트워크 테스트 =====
# App 헬스체크
curl localhost:3001/api/health

# Web 헬스체크
curl localhost:3000/api/health

# NLB 연결 테스트
curl http://<NLB_DNS>:3001/api/health

# ===== 환경변수 파일 =====
cat ~/megaticket/apps/web/.env.production
cat ~/megaticket/apps/app/.env.production
cat ~/dr-env.sh
cat ~/dr-web-env.sh

# ===== AWS 리소스 =====
# NLB 상태
aws elbv2 describe-load-balancers --names MegaTicket-DR-NLB --region ap-northeast-1

# Target Group 헬스
aws elbv2 describe-target-health --target-group-arn <TG_ARN> --region ap-northeast-1

# DynamoDB 테이블
aws dynamodb describe-table --table-name KDT-Msp4-PLDR-reservations --region ap-northeast-1
```

---

## 7. DR 자동화 파이프라인 트러블슈팅

이 섹션은 DR 자동 전환 파이프라인(EventBridge → Step Functions → SNS → Route53)에서 발생할 수 있는 문제들을 다룹니다.

### 실제 사용 중인 리소스명

| 구성요소 | 리소스명 |
|:---|:---|
| **Step Function** | `stfc-stepfunction-dev-an1` |
| **SNS Topic (승인)** | `stfc-topic-dev-an1-approval` |
| **EventBridge 규칙 (버지니아)** | `ssw-dr-failover-observation-alarm-rule` |
| **EventBridge 버스 (도쿄)** | `ssw-dr-failover-dr-event-bus` |
| **EventBridge 규칙 (도쿄)** | `pldr-dr-failover-rule` |

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           DR 자동화 파이프라인 흐름 (실제)                              │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   [Route53 헬스체크]                                                                  │
│         │                                                                            │
│         ▼ (ALARM 발생)                                                               │
│   [CloudWatch Alarm (us-east-1)]                                                     │
│         │                                                                            │
│         ▼                                                                            │
│   [버지니아 EventBridge 규칙]  ───────────────────┐                                   │
│   (ssw-dr-failover-observation-alarm-rule)         │                                  │
│                                                    │ Cross-Region Event               │
│                                                    ▼                                  │
│                                  [도쿄 커스텀 이벤트 버스]                              │
│                                  (ssw-dr-failover-dr-event-bus)                       │
│                                                    │                                  │
│                                                    ▼                                  │
│                                  [도쿄 EventBridge 규칙]                               │
│                                  (pldr-dr-failover-rule)                              │
│                                                    │                                  │
│                                                    ▼                                  │
│                                  [Step Functions]                                     │
│                                  (stfc-stepfunction-dev-an1)                          │
│                                                    │                                  │
│                    ┌───────────────────────────────┼───────────────────────┐          │
│                    │                               │                       │          │
│                    ▼                               ▼                       ▼          │
│              [Step 0: SNS 승인]            [Step 1~2: NLB/LT]      [Step 3: ASG]     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 7.1 EventBridge Cross-Region 이벤트 전달

#### 아키텍처 (실제 리소스명 기준)

```
Route53 헬스체크 → CloudWatch (us-east-1)
                          │
                          ▼
    [ssw-dr-failover-observation-alarm-rule] (버지니아 규칙)
                          │
               Cross-Region Event
                          │
                          ▼
    [ssw-dr-failover-dr-event-bus] (도쿄 커스텀 이벤트 버스)
                          │
                          ▼
    [pldr-dr-failover-rule] (도쿄 규칙)
                          │
                          ▼
    [stfc-stepfunction-dev-an1] (Step Functions)
```

> [!IMPORTANT]
> Route53 헬스체크 알람은 **반드시 버지니아(us-east-1)** 리전에서만 발생합니다.

#### 증상
- CloudWatch 알람은 발생했는데 Step Functions가 실행되지 않음
- 도쿄 EventBridge에 이벤트가 도착하지 않음

#### 체크포인트

```bash
# 1. 버지니아 EventBridge 규칙 확인
aws events describe-rule \
    --name "ssw-dr-failover-observation-alarm-rule" \
    --region us-east-1

# 2. 버지니아 → 도쿄 타겟 확인
aws events list-targets-by-rule \
    --rule "ssw-dr-failover-observation-alarm-rule" \
    --region us-east-1

# 예상 출력:
# "Arn": "arn:aws:events:ap-northeast-1:<ACCOUNT_ID>:event-bus/ssw-dr-failover-dr-event-bus"

# 3. 도쿄 커스텀 이벤트 버스 확인
aws events describe-event-bus \
    --name "ssw-dr-failover-dr-event-bus" \
    --region ap-northeast-1

# 4. 도쿄 규칙 확인
aws events describe-rule \
    --name "pldr-dr-failover-rule" \
    --event-bus-name "ssw-dr-failover-dr-event-bus" \
    --region ap-northeast-1
```

#### 필요한 IAM 정책 (버지니아 → 도쿄 이벤트 전달)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "events:PutEvents",
      "Resource": "arn:aws:events:ap-northeast-1:*:event-bus/ssw-dr-failover-dr-event-bus"
    }
  ]
}
```

#### 이벤트 패턴 예시

```json
{
  "source": ["aws.cloudwatch"],
  "detail-type": ["CloudWatch Alarm State Change"],
  "detail": {
    "alarmName": ["MegaTicket-Primary-HealthCheck-Alarm"],
    "state": {
      "value": ["ALARM"]
    }
  }
}
```

#### 해결법

```bash
# Cross-Region 이벤트 타겟 재설정
aws events put-targets \
    --rule "ssw-dr-failover-observation-alarm-rule" \
    --targets "Id"="TokyoEventBus","Arn"="arn:aws:events:ap-northeast-1:<ACCOUNT_ID>:event-bus/ssw-dr-failover-dr-event-bus","RoleArn"="arn:aws:iam::<ACCOUNT_ID>:role/EventBridge-CrossRegion-Role" \
    --region us-east-1
```

---

### 7.2 Step Functions 실행 실패

#### Step Function 단계별 역할

| Step | Lambda 함수 | 역할 |
|:---:|:---|:---|
| **Step 0** | `stfc-lambda-dev-step0` | 승인 대기 (`waitForTaskToken`) + SNS 알림 발송 |
| **Step 1** | `stfc-lambda-dev-step1` | NLB 생성 + Listener 설정 |
| **Step 2** | `stfc-lambda-dev-step2` | Launch Template 업데이트 (NLB DNS 주입) |
| **Step 3** | `stfc-lambda-dev-step3` | ASG 스케일업 (App/Web) |

#### 7.2.1 승인 타임아웃 (TaskToken 만료) - Step 0

##### 증상
- Step Functions가 "Waiting for human approval" 상태에서 멈춤
- 타임아웃 후 실행 실패

##### 원인
- SNS 승인 이메일을 받지 못함
- 승인 링크 클릭 전 타임아웃

##### 체크포인트

```bash
# Step Function 실행 상태 확인
aws stepfunctions describe-execution \
    --execution-arn "arn:aws:states:ap-northeast-1:<ACCOUNT_ID>:execution:stfc-stepfunction-dev-an1:xxx" \
    --region ap-northeast-1

# 현재 대기 중인 활동 확인
aws stepfunctions get-execution-history \
    --execution-arn "arn:aws:states:ap-northeast-1:<ACCOUNT_ID>:execution:stfc-stepfunction-dev-an1:xxx" \
    --region ap-northeast-1 \
    --query 'events[?type==`TaskStateEntered`]'
```

##### 해결법 (수동 승인)

```bash
# TaskToken으로 수동 승인 전송
aws stepfunctions send-task-success \
    --task-token "AAAAKxxx..." \
    --task-output '{"approved": true}' \
    --region ap-northeast-1

# 또는 거부
aws stepfunctions send-task-failure \
    --task-token "AAAAKxxx..." \
    --error "ManualReject" \
    --cause "Operator rejected the failover" \
    --region ap-northeast-1
```

#### 7.2.2 Lambda 실행 에러 - Step 1/2/3

##### 증상
- Step Functions 실행이 Lambda 단계에서 실패
- `Lambda.Unknown` 또는 `Lambda.ServiceException` 에러

##### 체크포인트

```bash
# Step 1 Lambda 로그 확인 (NLB 생성)
aws logs tail "/aws/lambda/stfc-lambda-dev-step1" \
    --since 1h \
    --region ap-northeast-1

# Step 2 Lambda 로그 확인 (Launch Template 업데이트)
aws logs tail "/aws/lambda/stfc-lambda-dev-step2" \
    --since 1h \
    --region ap-northeast-1

# Step 3 Lambda 로그 확인 (ASG 스케일업)
aws logs tail "/aws/lambda/stfc-lambda-dev-step3" \
    --since 1h \
    --region ap-northeast-1

# Lambda 함수 상태 확인
aws lambda get-function \
    --function-name stfc-lambda-dev-step1 \
    --region ap-northeast-1
```

##### 해결법

```bash
# Lambda 메모리/타임아웃 증가 (예: Step 1)
aws lambda update-function-configuration \
    --function-name stfc-lambda-dev-step1 \
    --timeout 300 \
    --memory-size 512 \
    --region ap-northeast-1
```

#### 7.2.3 ASG/NLB 생성 실패 시 롤백

##### 증상
- NLB 생성 중 리소스 충돌
- ASG 스케일업 실패

##### 체크포인트

```bash
# 기존 NLB 확인 (이름 충돌)
aws elbv2 describe-load-balancers \
    --names MegaTicket-DR-NLB \
    --region ap-northeast-1

# ASG 활동 확인
aws autoscaling describe-scaling-activities \
    --auto-scaling-group-name MegaTicket-DR-App-ASG \
    --region ap-northeast-1 \
    --max-items 5
```

##### 수동 롤백/재시도

```bash
# 1. 기존 NLB 삭제 (필요 시)
aws elbv2 delete-load-balancer \
    --load-balancer-arn <NLB_ARN> \
    --region ap-northeast-1

# 2. Step Function 재실행
aws stepfunctions start-execution \
    --state-machine-arn "arn:aws:states:ap-northeast-1:<ACCOUNT_ID>:stateMachine:stfc-stepfunction-dev-an1" \
    --input '{"source": "manual", "reason": "retry after cleanup"}' \
    --region ap-northeast-1
```

---

### 7.3 SNS 승인 이메일 문제

#### 7.3.1 구독 자동 삭제 (3일 내 미확인)

> [!CAUTION]
> SNS 이메일 구독은 **3일 이내에 확인(Confirm)하지 않으면 자동 삭제**됩니다!

##### 증상
- DR 알림 이메일이 오지 않음
- SNS 토픽에 구독이 없음

##### 체크포인트

```bash
# SNS 토픽 구독 목록 확인
aws sns list-subscriptions-by-topic \
    --topic-arn "arn:aws:sns:ap-northeast-1:<ACCOUNT_ID>:stfc-topic-dev-an1-approval" \
    --region ap-northeast-1

# 구독 상태 확인 (PendingConfirmation인지)
```

##### 해결법 (구독 재등록)

```bash
# 이메일 구독 재생성
aws sns subscribe \
    --topic-arn "arn:aws:sns:ap-northeast-1:<ACCOUNT_ID>:stfc-topic-dev-an1-approval" \
    --protocol email \
    --notification-endpoint "admin@company.com" \
    --region ap-northeast-1

# ⚠️ 이메일로 온 확인(Confirm) 링크를 반드시 클릭!
```

#### 7.3.2 이메일 바운스로 인한 구독 제거

##### 증상
- 구독이 있었는데 사라짐
- SNS 전송 성공 메트릭은 0

##### 원인
- 수신 이메일 서버에서 바운스(반송)
- 스팸 필터에 의한 차단
- 잘못된 이메일 주소

##### 해결법

```bash
# 1. 대체 이메일로 구독 추가
aws sns subscribe \
    --topic-arn "arn:aws:sns:ap-northeast-1:<ACCOUNT_ID>:stfc-topic-dev-an1-approval" \
    --protocol email \
    --notification-endpoint "backup-admin@company.com" \
    --region ap-northeast-1

# 2. SMS 알림도 함께 설정 (백업용)
aws sns subscribe \
    --topic-arn "arn:aws:sns:ap-northeast-1:<ACCOUNT_ID>:stfc-topic-dev-an1-approval" \
    --protocol sms \
    --notification-endpoint "+821012345678" \
    --region ap-northeast-1
```

#### 7.3.3 구독 상태 정기 점검 스크립트

```bash
#!/bin/bash
# check_sns_subscriptions.sh

TOPIC_ARN="arn:aws:sns:ap-northeast-1:<ACCOUNT_ID>:stfc-topic-dev-an1-approval"

echo "=== SNS 구독 상태 점검 ==="
SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic \
    --topic-arn $TOPIC_ARN \
    --region ap-northeast-1 \
    --query 'Subscriptions[*].{Endpoint:Endpoint,Protocol:Protocol,Status:SubscriptionArn}' \
    --output table)

echo "$SUBSCRIPTIONS"

# Confirmed 구독이 없으면 경고
CONFIRMED=$(echo "$SUBSCRIPTIONS" | grep -v "PendingConfirmation" | wc -l)
if [ "$CONFIRMED" -lt 2 ]; then
    echo "⚠️ WARNING: 확인된 구독이 없습니다! 구독을 다시 등록하세요."
fi
```

---

### 7.4 Route53 헬스체크

#### 헬스체크 설정 확인

```bash
# 헬스체크 목록 조회
aws route53 list-health-checks \
    --query 'HealthChecks[?HealthCheckConfig.FullyQualifiedDomainName==`pilotlight-test.click`]'

# 특정 헬스체크 상세 확인
aws route53 get-health-check \
    --health-check-id "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### 헬스체크 실패 조건

| 설정 | 기본값 | 설명 |
|:---|:---:|:---|
| `FailureThreshold` | 3 | 연속 실패 횟수 |
| `RequestInterval` | 30초 | 체크 간격 |
| 실패 감지 시간 | **~90초** | 3회 × 30초 |

> [!TIP]
> 더 빠른 감지를 원하면 `RequestInterval`을 10초로, `FailureThreshold`를 2로 설정하세요. (비용 증가)

#### Failover 전환 지연 시간 계산

```
헬스체크 실패 감지:  ~90초 (3회 × 30초)
CloudWatch 알람:     ~60초 (Evaluation Period)
EventBridge 전달:    ~수초
Step Function 실행:  ~수분 (NLB 생성, ASG 스케일업)
DNS TTL 전파:        60~300초
────────────────────────────────────────
총 예상 RTO:         5~10분
```

#### DNS TTL과 전파 시간

> [!WARNING]
> DNS TTL 값이 길면 클라이언트가 오래된 IP를 캐싱하여 DR 전환이 지연됩니다.

**권장 설정:**

| 레코드 타입 | 권장 TTL | 이유 |
|:---|:---:|:---|
| Failover Primary | 60초 | 빠른 전환 |
| Failover Secondary | 60초 | 빠른 전환 |
| 일반 A/AAAA | 300초 | 성능 최적화 |

```bash
# 현재 TTL 확인
aws route53 list-resource-record-sets \
    --hosted-zone-id "Z1234567890" \
    --query 'ResourceRecordSets[?Name==`pilotlight-test.click.`]'

# TTL 변경 (60초로)
aws route53 change-resource-record-sets \
    --hosted-zone-id "Z1234567890" \
    --change-batch '{
      "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "pilotlight-test.click",
          "Type": "A",
          "TTL": 60,
          "AliasTarget": {
            "HostedZoneId": "Z14GRHDCWA56QT",
            "DNSName": "MegaTicket-ALB-xxx.ap-northeast-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      }]
    }'
```

#### 헬스체크 트러블슈팅

##### 증상: 헬스체크가 계속 실패

```bash
# 헬스체크 상태 확인
aws route53 get-health-check-status \
    --health-check-id "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# 각 체커 리전별 상태 확인
# StatusReport → Status: "Failure" 또는 "Success"
```

##### 원인 및 해결법

| 원인 | 해결법 |
|:---|:---|
| 보안그룹에서 Route53 체커 IP 차단 | Route53 체커 IP 대역 허용 |
| ALB 헬스체크 경로 오류 | `/api/health` 경로 확인 |
| SSL 인증서 문제 | HTTPS 헬스체크 시 인증서 유효성 확인 |
| 타겟 인스턴스 다운 | ALB Target Group 상태 확인 |

**Route53 체커 IP 허용 (보안그룹):**

```bash
# Route53 헬스체커 IP 범위 조회
curl -s https://ip-ranges.amazonaws.com/ip-ranges.json | \
    jq '.prefixes[] | select(.service=="ROUTE53_HEALTHCHECKS") | .ip_prefix'

# 보안그룹에 인바운드 규칙 추가 (예시)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 15.177.0.0/18 \
    --region ap-northeast-2
```

---

## 부록 B: DR 자동화 파이프라인 상태 점검 스크립트

```bash
#!/bin/bash
# dr_pipeline_health_check.sh
# DR 자동화 파이프라인 전체 상태 점검

echo "========================================"
echo "DR 자동화 파이프라인 상태 점검"
echo "$(date)"
echo "========================================"

# 1. Route53 헬스체크
echo ""
echo "[1/4] Route53 헬스체크"
HC_STATUS=$(aws route53 get-health-check-status \
    --health-check-id "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
    --query 'HealthCheckObservations[0].StatusReport.Status' \
    --output text 2>/dev/null || echo "N/A")
echo "  상태: $HC_STATUS"

# 2. EventBridge 규칙 (버지니아)
echo ""
echo "[2/4] EventBridge 규칙 (us-east-1)"
EB_RULE=$(aws events describe-rule \
    --name "ssw-dr-failover-observation-alarm-rule" \
    --region us-east-1 \
    --query 'State' \
    --output text 2>/dev/null || echo "NOT_FOUND")
echo "  상태: $EB_RULE"

# 3. Step Functions
echo ""
echo "[3/4] Step Functions (ap-northeast-1)"
SF_RECENT=$(aws stepfunctions list-executions \
    --state-machine-arn "arn:aws:states:ap-northeast-1:<ACCOUNT_ID>:stateMachine:stfc-stepfunction-dev-an1" \
    --max-results 1 \
    --region ap-northeast-1 \
    --query 'executions[0].{Status:status,StartDate:startDate}' \
    --output text 2>/dev/null || echo "N/A")
echo "  최근 실행: $SF_RECENT"

# 4. SNS 구독
echo ""
echo "[4/4] SNS 구독 (ap-northeast-1)"
SNS_SUBS=$(aws sns list-subscriptions-by-topic \
    --topic-arn "arn:aws:sns:ap-northeast-1:<ACCOUNT_ID>:stfc-topic-dev-an1-approval" \
    --region ap-northeast-1 \
    --query 'Subscriptions | length(@)' \
    --output text 2>/dev/null || echo "0")
echo "  활성 구독 수: $SNS_SUBS"

# 결과 요약
echo ""
echo "========================================"
echo "점검 완료"
if [[ "$HC_STATUS" == "Success" && "$EB_RULE" == "ENABLED" && "$SNS_SUBS" -ge 1 ]]; then
    echo "✅ 모든 구성요소 정상"
else
    echo "⚠️ 일부 구성요소에 문제가 있습니다. 위 내용을 확인하세요."
fi
```

---

> **문서 작성일:** 2026-01-08  
> **마지막 검증:** 서울 → 도쿄 DR Failover/Failback 테스트 완료  
> **업데이트:** DR 자동화 파이프라인 섹션 추가, 실제 리소스명 반영
