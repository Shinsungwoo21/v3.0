# 구현 계획 - 샤롯데시어터 좌석 배치도

## 목표
MegaTicket의 좌석 선택 UI를 샤롯데시어터 레이아웃(1층/2층, A/B/C 구역, 특정 색상 및 배치 형태)으로 업데이트합니다.

## 변경 제안

### 1. 데이터 구조 및 생성
- `scripts/generate_charlotte_data.py` 생성.
- 섹션 ID 또는 `floor` 필드를 통해 두 개의 주요 그룹 정의:
    - 1층 (A, B, C 구역)
    - 2층 (A, B, C 구역)
- **1층 레이아웃:**
    - **OP**: B구역 맨 앞.
    - **B**: 직사각형, 1~21열.
    - **A/C**: 부채꼴/곡선형. 1~21열.
- **2층 레이아웃:**
    - 1~12열.
- **등급:** 정확한 색상과 가격 매핑.

### 2. 프론트엔드 컴포넌트

#### `types/venue.ts`
- `Section` 인터페이스에 층을 구분할 수 있는 정보 추가 (예: `floor: string` 필드 추가 또는 `sectionId` 규칙 활용).

#### `components/seats/templates/theater-template.tsx`
- **상태**: `selectedFloor` ('1층', '2층') 상태 추가.
- **레이아웃**:
    - 층 전환을 위한 탭 버튼 추가.
    - `selectedFloor`에 따라 `venueData.sections` 필터링.
    - 섹션을 수직 스택 대신 수평 레이아웃(`flex-row`)으로 배치.
    - **섹션 컨테이너**:
        - A 구역: `transform: rotate(10deg)` (곡선 효과 시뮬레이션).
        - B 구역: `transform: none`.
        - C 구역: `transform: rotate(-10deg)`.
    - 라벨: 그리드 상단에 "A", "B", "C" 헤더 추가.
    - 출입구: 하단에 시각적 표시 추가.

#### `components/seats/seat-button.tsx`
- 새로운 요구사항에 맞춰 색상 스타일 업데이트 (`statusStyles` 또는 `grade.color` 사용).

## 검증 계획
1. 데이터 생성 스크립트 실행.
2. JSON 출력 구조 확인.
3. UI 확인:
    - 층 탭 작동 여부.
    - 올바른 구역 배치 (좌측 A, 중앙 B, 우측 C).
    - 열/등급별 정확한 색상 적용.
    - "출입구" 표시 확인.
