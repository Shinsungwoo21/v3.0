# 좌석 선점/결제 안내 UX 및 안전장치 강화

## 목표
1. **DR 안내 메시지 오발송 수정**: 정상 리전에서 "내 예약 메뉴에서 결제하세요"라는 DR용 안내가 나오지 않도록 프롬프트 강화.
2. **결제 링크 안전장치 추가**: 타이머/버튼 UI가 렌더링되지 않는(또는 늦게 뜨는) 경우를 대비해, 텍스트 메시지 자체에 결제 페이지로 이동하는 Markdown Link 추가.
3. **프론트엔드 검증 로직 검토**: 필요 시 프론트엔드 파싱 로직 보완.

## 작업 목록

- [x] **Core Logic (Backend)**
    - [x] `apps/app/lib/server/holding-manager.ts`: **Verify-After-Write** 및 **Max 3 Retries** 로직 구현.
    - [x] `apps/app/lib/tools/holding-tools.ts`: 선점 실패 시 AI가 명확히 안내하도록 메시지 처리. Markdown 결제 링크 추가.
    - [x] `apps/app/lib/tools/holding-tools.ts`: `holdSeats` 입력값(seatIds) 유효성 검증(배열 확인) 추가.
    - [x] `apps/app/lib/server/holding-manager.ts`: 불필요한 CloudWatch 로그(`console.log`) 주석 처리.
- [x] **Prompt Engineering**
    - [x] `apps/app/lib/prompts/base-prompt.ts`: DR 안내 멘트 수정 (오발송 방지).
- [x] **Documentation**
    - [x] `docs/Bedrock_Technical_Guide.md`: 12. Score Configuration 인코딩 복구 및 13. Safety & Robustness 추가.
- [x] **Verification**
    - [x] Build & Push
