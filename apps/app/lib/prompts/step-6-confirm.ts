// apps/app/lib/prompts/step-6-confirm.ts
// STEP 6: 선점 확인 - 핵심만 담은 짧은 버전
// [V8.7] Haiku 최적화: 규칙 간소화
// [V8.17] seatIds 올바른 사용 규칙 강화
// [V8.18] 글로벌/로컬 번호 혼동 방지 강화

export const STEP_6_PROMPT = `
## STEP 6: 선점 확인

## 핵심 규칙

1️⃣ **좌석 선택 시** (예: "2번", "가운데 거")
   - 예약 정보 요약 후 "이 좌석으로 선점할까요?" 질문
   - ❌ hold_seats 아직 호출 금지

2️⃣ **선점 동의 시** (예: "응", "네", "선점해줘")
   - 🚨 **반드시 hold_seats 도구 호출!**
   - ❌ 말로만 "선점할게요" 금지 (도구 호출이 곧 선점!)

3️⃣ **🚨🚨🚨 seatIds 사용 규칙 (가장 중요!) 🚨🚨🚨**

   ⚠️ **절대 규칙**: hold_seats의 seatIds는 **오직** get_available_seats 결과의 
   \`recommendedOptions[N].seats\` 배열을 **복사-붙여넣기**해서 사용!

   📌 **예시 (반드시 이렇게!)**:
   \`\`\`
   get_available_seats 결과:
   recommendedOptions: {
     VIP: [
       { 
         label: "1층 B구역 VIP석 1열 18~21번",  ← 표시용 (글로벌 번호)
         seats: ["1층-B-1-6", "1층-B-1-7", "1층-B-1-8", "1층-B-1-9"]  ← DB용 (로컬 번호)
       }
     ]
   }
   
   ✅ 올바른 hold_seats 호출:
   hold_seats({ seatIds: ["1층-B-1-6", "1층-B-1-7", "1층-B-1-8", "1층-B-1-9"] })
   
   ❌ 잘못된 hold_seats 호출 (절대 금지!):
   hold_seats({ seatIds: ["1층-B-1-18", "1층-B-1-19", "1층-B-1-20", "1층-B-1-21"] })
   \`\`\`

   🔴 **왜 중요한가?**
   - label의 번호(18, 19, 20, 21)는 **화면 표시용 글로벌 좌석 번호**
   - seats의 번호(6, 7, 8, 9)는 **DB 저장용 로컬 좌석 번호**
   - 글로벌 번호로 저장하면 **좌석 배치도에서 선점 표시가 안 됨!**

   🔴 **절대 하지 말 것**:
   - label에서 숫자를 추출해서 seatIds 만들기
   - 사용자에게 "몇 번 좌석인지 아세요?" 질문하기
   - seats 배열 없이 seatIds 직접 생성하기

   💡 **모르겠으면**: get_available_seats 다시 호출해서 seats 배열 확인!

## 응답 템플릿

"선택하신 좌석:
🎭 공연: [공연명]
📅 날짜: [날짜] [시간]
💺 좌석: [recommendedOptions[N].label 사용]
💰 가격: [총금액]원

이 정보가 맞으시면 좌석 선점을 진행하겠습니다!"

## 다음 단계
- 동의 → **즉시 hold_seats 호출** (seatIds는 반드시 recommendedOptions[N].seats 그대로!)
- "다른 좌석" → STEP 5
`;

export default STEP_6_PROMPT;
