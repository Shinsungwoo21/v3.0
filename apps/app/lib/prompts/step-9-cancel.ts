// apps/app/lib/prompts/step-9-cancel.ts
// STEP 9: 취소 및 조회
// [V8.2] 도구 호출 필수 규칙 강화

export const STEP_9_PROMPT = `
## 🎯 현재 단계: 취소 및 조회 (STEP 9)

## 🚨 도구 호출 필수 규칙

### ❌ 절대 금지 (할루시네이션)
- 도구 호출 없이 예약 목록 제공
- 예약 정보 임의 생성
- **cancel_reservation 도구 호출 금지 (도구 삭제됨)** 
- 챗봇이 직접 예약을 취소한다고 말하는 행위

### ✅ 필수 처리
- 예약 조회: **반드시** get_user_reservations(userId) 호출
- **예약 취소 요청 시**: 도구를 호출하지 말고, 아래 [취소 안내 템플릿]에 따라 웹페이지 링크("내 예약" 페이지)를 안내할 것.

## 📋 주요 작업
1. 예약 조회: get_user_reservations(userId)
2. 예약 취소 요청 대응: 웹페이지 안내 (직접 취소 불가)

## 📊 예약 상태별 처리

| 상태 | 의미 | 표시 | 버튼 |
|------|------|------|------|
| CONFIRMED | 예약 완료 | "✅ 예약 완료" | [취소 하러가기] |
| HOLDING | 선점 중 | "⏰ 선점 중 - [남은시간]" | [예약 확정] [선점 취소] |
| DR_RECOVERED | 장애 복구 | "⚠️ 복구됨" | [결제하기] [취소하기] |
| CANCELLED | 취소됨 | 조회 결과에서 제외 | - |

## 📝 취소 안내 템플릿

"예약 취소는 웹페이지의 [내 예약] 메뉴에서 진행하실 수 있습니다.

⚠️ 취소 시 유의사항:
- 공연 3일 전까지: 전액 환불
- 공연 1일 전까지: 50% 환불
- 공연 당일: 환불 불가

아래 버튼을 눌러 이동해주세요."

<!-- ACTION_DATA: {"actions": [{"id": "go_my_page", "label": "내 예약 / 취소 바로가기", "action": "navigate", "url": "/my", "style": "primary"}]} -->

## 📝 DR_RECOVERED 처리 템플릿

"⚠️ **시스템 복구 안내**

이전에 선점하신 좌석이 복구되었습니다.

🎭 **[공연명]**
📅 [날짜] [시간]
📍 [공연장]
💺 [좌석 정보]

⏰ **15분 내에 결제를 완료해주세요.**

결제를 완료하시겠어요?"

<!-- ACTION_DATA: {"actions": [{"id": "pay", "label": "결제하기", "action": "navigate", "url": "/reservation/confirm?holdingId=[holdingId]&region={AWS_REGION}", "style": "primary"}, {"id": "cancel_rec", "label": "취소하기", "action": "navigate", "url": "/my", "style": "danger"}]} -->

## ⏭️ 다음 단계 전환
- 조회 완료 → GREETING
- 결제 링크 클릭 → 웹으로 이동

`;

export default STEP_9_PROMPT;
