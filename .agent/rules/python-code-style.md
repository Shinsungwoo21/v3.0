# Python 코드 스타일 규칙

이 문서는 AI Agent를 위한 Python 코드 스타일 가이드라인을 정의합니다. 이 규칙을 준수함으로써 코드베이스 전체의 일관성, 가독성 및 유지보수성을 보장합니다.

## 1. 일반 원칙 (General Principles)
- **PEP 8**: [PEP 8](https://peps.python.org/pep-0008/)을 기본 기준으로 따릅니다.
- **가독성 (Readability)**: 코드는 작성되는 것보다 읽히는 경우가 훨씬 많습니다. 기발함보다는 명확성을 우선시하세요.
- **명시적인 것이 암시적인 것보다 낫다 (Explicit is better than implicit)**: 매직 넘버나 모호한 로직을 피하세요.

## 2. 명명 규칙 (Naming Conventions)
- **변수 및 함수**: snake_case를 사용합니다.
  `python
  user_name = "Alice"
  def calculate_total(): ...
  `
- **클래스**: PascalCase (CapWords)를 사용합니다.
  `python
  class UserProfile: ...
  `
- **상수**: UPPER_CASE_WITH_UNDERSCORES를 사용합니다.
  `python
  MAX_RETRIES = 3
  `
- **프라이빗 멤버**: 내부 사용을 위해 단일 선행 밑줄 _variable을 사용합니다.
- **한 글자 이름 피하기**: 루프의 i, j나 좌표의 x, y와 같은 카운터를 제외하고는 피합니다.

## 3. 포맷팅 (Formatting)
- **들여쓰기**: 들여쓰기 레벨당 4개의 공백(Space)을 사용합니다. **탭(Tab)을 사용하지 마세요.**
- **줄 길이**: 줄당 88자(Black 스타일) 또는 79자(PEP 8)로 제한합니다. 최신 코드베이스에서는 88자를 선호합니다.
- **빈 줄**:
  - 최상위 함수 및 클래스: 2개의 빈 줄.
  - 클래스 내부의 메서드: 1개의 빈 줄.
- **임포트 (Imports)**:
  - 파일의 맨 위에 임포트를 배치합니다.
  - 그룹 순서: 표준 라이브러리 -> 서드파티 -> 로컬 애플리케이션.
  - 가능한 경우 절대 경로 임포트(absolute imports)를 사용합니다.

## 4. 타입 힌팅 (Type Hinting)
- **항상 타입 힌트를 사용하세요**: 함수 인자 및 반환 값에 대해 타입 힌트를 작성합니다.
- 복잡한 타입(예: List, Dict, Optional, Any)의 경우 	yping 모듈을 사용하거나 Python 3.9+ 이상의 표준 컬렉션을 사용합니다.
  `python
  def greet(name: str) -> str:
      return f"Hello, {name}"
  `

## 5. 독스트링 (Docstrings)
- **Google 스타일**을 선호합니다.
- 모든 공개 모듈, 함수, 클래스 및 메서드에는 독스트링이 있어야 합니다.
  `python
  def fetch_data(url: str) -> dict:
      """주어진 URL에서 데이터를 가져옵니다.

      Args:
          url: 데이터를 가져올 URL입니다.

      Returns:
          JSON 응답을 포함하는 딕셔너리입니다.
      """
      ...
  `

## 6. 최신 Python 기능 (Modern Python Features)
- **f-strings**: 문자열 보간을 위해 %나 .format() 대신 f-strings를 사용합니다.
  `python
  # Good
  print(f"User: {name}")
  `
- **Pathlib**: 파일 경로 조작을 위해 os.path 대신 pathlib을 사용합니다.

## 7. 에러 처리 (Error Handling)
- **구체적인 예외**: 막연한 except: 대신 구체적인 예외를 잡으세요.
  `python
  try:
      ...
  except ValueError as e:
      ...
  `
- **설명적인 에러 메시지**: 에러 메시지에 맥락을 제공하세요.

## 8. 주석 (Comments)
- *무엇(what)*이 아니라 *왜(why)*를 설명하는 주석을 작성하세요. *무엇*은 코드가 보여주어야 합니다.
- 코드 변경 사항에 맞춰 주석을 최신 상태로 유지하세요.

## 9. 테스트 (Testing)
- 새로운 로직에 대해 단위 테스트(Unit tests)를 작성하세요.
- 별도로 명시되지 않은 경우 테스트 프레임워크로 pytest를 사용하세요.
