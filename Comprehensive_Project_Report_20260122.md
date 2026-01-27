# 2026-01-22 프로젝트 작업 보고서: 인디밴드 섹션 전환 및 최적화

## 1. 프로젝트 개요 (Overview)
본 프로젝트의 목표는 기존 웹사이트의 "콘서트" 섹션을 새로운 **"인디밴드"** 테마로 전환하고, 4개의 인디밴드 공연(정오별점, 29CM STAGE, 자유낙하, ON:AIR) 데이터를 실제 예약 시스템에 연동하는 것입니다. 또한, 배포 후 발생한 성능 및 접속 이슈를 해결하여 안정적인 서비스를 제공하는 것을 포함합니다.

---

## 2. 구현 상세 (Implementation Details)

### 2.1 프론트엔드 (Frontend)
- **변경 파일**: `apps/web/components/concert-section.tsx`
- **주요 내용**:
    - 섹션 타이틀을 **"🎸 인디밴드"**, 부제목을 **"유니크한 감성, 인디 밴드의 세계로"**로 변경.
    - 기존 콘서트 데이터 배열을 보존(주석 처리)하고, 새로운 인디밴드 데이터로 교체.
    - 각 밴드의 포스터 이미지와 태그(HOT/NEW) 적용.

### 2.2 데이터베이스 및 백엔드 (Infra & Backend)
- **데이터베이스**: DynamoDB `plcr-gtbl-performances`, `plcr-gtbl-schedules`
- **데이터 업로드**: `scripts/upload-indie-bands.mjs` 스크립트를 사용하여 아래 상세 명세를 DB에 적재함.

#### [상세 데이터 명세]

**1. 정오별점 (기존 BTS 데이터 기반)**
- `performanceId`: `perf-jeong-o-byeol-jeom`
- `title`: "✷ 정 오 별 점 pt.2 ✷"
- `venueId`: "charlotte-theater" (기존 호환성 유지)
- `venue`: "언플러그드 라운지 (서울 마포구 와우산로29길 15 2층)"
- `posterUrl`: "/posters/indie-band-1.png"
- `price`: "1층 90,000원 / 2층 70,000원"
- `startDate`: "2026-02-20"
- `endDate`: "2026-02-22"
- `dateRange`: "2026.02.20 ~ 2026.02.22"
- `schedule`: "금토일 19:00"
- `description`: "그냥 마음 편히 1등이고 싶어.\n적어도 오늘만큼은 말이야!\n\n𖤐 기묘말 - @mikk.oz\n𖤐 언더플로우 - @under__flow"
- `cast`: `{"indie": ["기묘말", "언더플로우"]}`
- `seatGrades`:
  ```json
  [
    {"grade": "1층", "price": 90000, "color": "#14213D", "description": "1층 스탠딩/좌석 (Midnight Navy)"},
    {"grade": "2층", "price": 70000, "color": "#FCA311", "description": "2층 좌석 (Starlight Yellow)"}
  ]
  ```
- `seatColors`: `{"1층": "#14213D", "2층": "#FCA311"}`
- `gradeMapping`: 기존 BTS의 `VIP` → `1층`, `R` → `2층`

**2. 29CM STAGE (기존 Blackpink 데이터 기반)**
- `performanceId`: `perf-29cm-stage`
- `title`: "[29CM STAGE] 6th STAGE"
- `venueId`: "charlotte-theater" (기존 호환성 유지)
- `venue`: "무신사개러지 (서울 마포구 잔다리로 32 서문빌딩 지하1층)"
- `posterUrl`: "/posters/indie-band-2.png"
- `price`: "1층 70,000원 / 2층 50,000원"
- `startDate`: "2026-03-13"
- `endDate`: "2026-03-15"
- `dateRange`: "2026.03.13 ~ 2026.03.15"
- `schedule`: "금토일 19:00"
- `description`: "[29CM STAGE] 6th STAGE – DAY 1\n\n음악으로 공간을 채우고, 감각이 깨어나는 특별한 경험.\n\n29CM가 전개중인 자체 기획 콘서트 프로그램인 이구스테이지가 두루두루아티스트컴퍼니 @dooroodooroo.ac 의 아티스트들과 함께 이틀간의 일정으로 더 풍성하게 진행됩니다."
- `cast`: `{"indie": ["장기하", "양치기소년단"]}`
- `seatGrades`:
  ```json
  [
    {"grade": "1층", "price": 70000, "color": "#2E4053", "description": "1층 (Urban Navy)"},
    {"grade": "2층", "price": 50000, "color": "#FF5A00", "description": "2층 (Accent Orange)"}
  ]
  ```
- `seatColors`: `{"1층": "#2E4053", "2층": "#FF5A00"}`
- `gradeMapping`: 기존 Blackpink의 `VIP` → `1층`, `R` → `2층`

**3. 자유낙하 (기존 Day6 데이터 기반)**
- `performanceId`: `perf-free-fall`
- `title`: "자유낙하 - [Free Fall to Indie]"
- `venueId`: "charlotte-theater" (기존 호환성 유지)
- `venue`: "언플러그드 라운지 (서울 마포구 와우산로29길 15 2층)"
- `posterUrl`: "/posters/indie-band-3.png"
- `price`: "1층 80,000원 / 2층 50,000원"
- `startDate`: "2026-03-27"
- `endDate`: "2026-03-29"
- `dateRange`: "2026.03.27 ~ 2026.03.29"
- `schedule`: "금토일 19:00"
- `description`: "자유낙하 공연 소식📣\n\n[Free Fall to Indie]"
- `cast`: `{"indie": ["오예본", "우수현", "민채영"]}`
- `seatGrades`:
  ```json
  [
    {"grade": "1층", "price": 80000, "color": "#00BFFF", "description": "1층 (Deep Sky Blue)"},
    {"grade": "2층", "price": 50000, "color": "#B0C4DE", "description": "2층 (Light Steel Blue)"}
  ]
  ```
- `seatColors`: `{"1층": "#00BFFF", "2층": "#B0C4DE"}`
- `gradeMapping`: 기존 Day6의 `VIP` → `1층`, `R` → `2층`

**4. ON:AIR (기존 IVE 데이터 기반)**
- `performanceId`: `perf-on-air`
- `title`: "ON:AIR"
- `venueId`: "charlotte-theater" (기존 호환성 유지)
- `venue`: "서울스트리밍스테이션 (서울 강남구 강남대로110길 51)"
- `posterUrl`: "/posters/indie-band-4.png"
- `price`: "1층 70,000원 / 2층 50,000원"
- `startDate`: "2026-02-27"
- `endDate`: "2026-03-01"
- `dateRange`: "2026.02.27 ~ 2026.03.01"
- `schedule`: "금토일 19:30"
- `description`: "ON:AIR 는 ‘보이는 라디오’ 콘셉트의 라이브 공연입니다.\n공연 중 각 밴드 셋업 시간에 MC와 각 밴드 보컬이, 사전에 추첨된 관객의 사연을 직접 읽어드립니다."
- `cast`: `{"indie": ["디아틱", "세븐아워즈", "나타샤"]}`
- `seatGrades`:
  ```json
  [
    {"grade": "1층", "price": 70000, "color": "#E01E37", "description": "1층 (On Air Red)"},
    {"grade": "2층", "price": 50000, "color": "#ADB5BD", "description": "2층 (Studio Grey)"}
  ]
  ```
- `seatColors`: `{"1층": "#E01E37", "2층": "#ADB5BD"}`
- `gradeMapping`: 기존 IVE의 `VIP` → `1층`, `R` → `2층`


### 2.3 배포 (Deployment)
- **Web App**: Next.js Static Export (`npm run build`) 후 S3 버킷 동기화.
- **S3 Sync**:
    - 서울 리전 (`plcr-s3-web-an2`): 메인 서비스 배포.
    - 도쿄 리전 (`plcr-s3-web-an1`): DR 환경 배포 (재해 복구용 설정 유지).
- **CDN**: CloudFront 캐시 무효화(`aws cloudfront create-invalidation`) 수행.

---

## 3. 트러블슈팅 및 최적화 (Troubleshooting & Optimization)

작업 진행 중 발생한 3가지 주요 이슈에 대한 원인 분석 및 해결 과정입니다.

### 3.1 이슈: 상세 페이지 404/502 Bad Gateway
- **증상**: 메인 페이지에서 인디밴드 클릭 시 상세 페이지 접속 불가.
- **원인 분석**:
    1. **CloudFront 캐싱**: 이전 배포 시점의 '페이지 없음(404)' 응답이 CDN에 캐시됨.
    2. **서버 응답 없음(502)**: App 서버 인스턴스가 배포 간 상태 불일치(Stale)로 인해 요청을 처리하지 못함.
- **조치 결과**:
    - **ASG Refresh**: `aws autoscaling start-instance-refresh` 명령으로 App 서버 인스턴스를 최신 상태로 교체.
    - **Cache Invalidation**: `/*` 경로에 대해 CloudFront 캐시 강제 무효화 수행하여 정상화.

### 3.2 이슈: 페이지 로딩 속도 저하
- **증상**: 인디밴드 섹션 추가 후 초기 로딩 속도가 현저히 느려짐.
- **원인 분석**: 제공된 원본 포스터 이미지의 용량이 웹 환경에 부적합하게 큼.
    - `indie-band-3.png`: **2.3MB**
    - `indie-band-4.png`: **1.4MB**
- **조치 결과**:
    - Python `Pillow` 라이브러리를 사용한 이미지 최적화 스크립트 작성 및 실행.
    - **최적화 결과**:
        - `indie-band-3.png`: 2.3MB → **191KB (92% 감소)**
        - `indie-band-4.png`: 1.4MB → **276KB (80% 감소)**
    - 최적화된 이미지를 S3에 재업로드하여 체감 로딩 속도 대폭 개선.

### 3.3 이슈: 예약 내역 미표시
- **증상**: 로그인 후 '내 예약' 페이지에 들어갔으나 "예약 내역이 없습니다" 메시지 표시.
- **원인 분석**:
    - 백엔드 DB 조회 결과(`mock-user-01`) 데이터는 정상(85건) 존재함이 확인됨.
    - 사용자의 브라우저 세션이 다른 임시 계정(Guest) 또는 이전 캐시된 세션으로 로그인되어 있어 DB의 데이터와 매칭되지 않음.
- **조치 결과**: 사용자에게 로그아웃 후 테스트 계정(`test@example.com`)으로 재로그인 가이드 제공.

---

## 4. 검증 결과 (Verification)

| 항목 | 검증 내용 | 결과 |
| :--- | :--- | :---: |
| **메인 UI** | "인디밴드" 섹션 타이틀 및 4개 카드 정상 표시 | ✅ |
| **데이터 연동** | 상세 페이지에서 공연 정보(제목, 일시, 가격) 정상 로딩 | ✅ |
| **예약 시스템** | 좌석 선택 및 예매 프로세스 정상 동작, DB 반영 확인 | ✅ |
| **성능 (Speed)** | 이미지 최적화 후 페이지 로딩 지연 없음 | ✅ |
| **DR 환경** | 도쿄 리전 config.js 설정 유지 및 데이터 동기화(Global Table) 확인 | ✅ |

---

## 5. 향후 참고 사항 (Notes)

- **DR(재해 복구) 환경**: 도쿄 리전(`ap-northeast-1`)의 S3 버킷 설정(`config.js`)은 서울 리전 배포 시 덮어쓰여지지 않도록 별도 관리되고 있습니다. 안심하고 배포하셔도 됩니다.
- **운영 팁**: 추후 이미지 자산 추가 시, 반드시 웹용으로 리사이징(TinyPNG 등) 및 용량 최적화를 거친 후 업로드해야 합니다.
