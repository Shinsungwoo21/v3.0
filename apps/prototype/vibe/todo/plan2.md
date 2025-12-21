# Bedrock 챗봇 Frontend 고도화 계획 (Modern Stack)

현재의 Streamlit 프로토타입을 넘어, 최신 프론트엔드 기술을 적용하여 **"예쁘고 멋진"** 프리미엄 챗봇 애플리케이션으로 재구축하기 위한 계획입니다.

## 1. 기술 스택 (Tech Stack)
가장 트렌디하고 강력한 성능을 제공하는 스택을 선정했습니다.

- **Framework**: **Next.js 14+ (App Router)**
    - React 최신 기능을 활용한 서버 사이드 렌더링(SSR) 및 정적 생성.
    - 빠르고 효율적인 라우팅.
- **Styling**: **Tailwind CSS**
    - 유틸리티 퍼스트 CSS로 빠른 UI 개발.
    - 커스텀 디자인 시스템 구축 용이.
- **Components**: **shadcn/ui**
    - Radix UI 기반의 Headless 컴포넌트 라이브러리.
    - 접근성이 뛰어나고 디자인 커스터마이징이 매우 자유로움.
    - "복사/붙여넣기" 방식으로 필요한 컴포넌트만 가볍게 사용.
- **Animations**: **Framer Motion**
    - 자연스러운 메시지 등장 효과, 로딩 인터랙션, 페이지 전환 애니메이션 구현.
    - "Wwow" 포인트를 위한 마이크로 인터랙션 필수 요소.
- **Icons**: **Lucide React**
    - 깔끔하고 모던한 벡터 아이콘.
- **State Management**: **Zustand**
    - 가볍고 직관적인 전역 상태 관리 (대화 이력 등).
- **Backend Integration**: **Vercel AI SDK** (또는 AWS SDK for JS v3)
    - 스트리밍 응답 처리에 최적화된 표준 AI 인터페이스 제공.

## 2. 디자인 컨셉 (Design Aesthetic)
사용자 경험(UX)과 심미성(UI)을 극대화합니다.

- **Glassmorphism (글래스모피즘)**: 반투명한 블러 효과를 사용하여 입체감과 현대적인 느낌 부여.
- **Dynamic Gradients**: 은은하게 흐르는 배경 그라디언트로 생동감 표현.
- **Dark Mode First**: 전문가스러운 느낌을 주는 다크 모드를 기본으로 하되, 시스템 설정에 반응.
- **Typography**: `Inter` 또는 `Pretendard`와 같은 가독성 좋고 세련된 산세리프 폰트 사용.
- **Chat Interface**:
    - 말풍선 대신 모던한 메시지 블록 디자인.
    - 타이핑 텍스트 효과 (Typewriter Effect).
    - 코드 블록 Syntax Highlighting (Prism.js 등 활용).

## 3. 구현 기능 (Features)
1.  **실시간 스트리밍 채팅**: 끊김 없는 부드러운 텍스트 생성 UI.
2.  **모델 스위칭 UI**: 직관적인 토글 또는 탭 메뉴로 Sonnet/Nova 모델 전환.
3.  **반응형 레이아웃**: 모바일, 태블릿, 데스크탑 완벽 지원.
4.  **대화 기록 관리**: 로컬 스토리지 또는 DB(옵션)를 활용한 대화 저장.

## 4. 마이그레이션 단계
1.  **프로젝트 초기화**: `npx create-next-app@latest`
2.  **AWS 연동**: 기존 Python Boto3 로직을 Next.js API Routes (AWS SDK for JavaScript v3)로 이관.
    - Python 백엔드를 유지하고 싶다면 FastAPI로 분리하여 연동 가능.
3.  **UI 컴포넌트 개발**: 레이아웃, 채팅창, 입력바 등 핵심 컴포넌트 제작.
4.  **애니메이션 적용**: 메시지 전송/수신 시 생동감 있는 효과 추가.
