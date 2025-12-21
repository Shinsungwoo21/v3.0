---
trigger: always_on
---

# Bedrock Chatbot Agent Guide
이 문서는 AWS Bedrock API를 기반으로 구축된 챗봇 애플리케이션의 개발 및 운영 가이드입니다.

## 1. 프로젝트 개요 (Overview)
본 프로젝트는 AWS Bedrock의 Foundation Model(FM)을 활용하여 대화형 AI 에이전트를 구축하는 것을 목표로 합니다.
- **핵심 기술**: AWS Bedrock Runtime API, Python3.11, Streamlit
- **Python 라이브러리**: Boto3, Botocore, Streamlit
- **주요 기능**: 멀티턴 대화, 스트리밍 응답, 컨텍스트 관리, 대화 이력 저장 및 관리

## 2. 개발 환경 설정 (Environment Setup)

### 2.1 인증 및 권한 (Authentication)
보안 모범 사례에 따라 장기 자격 증명(Access Key) 대신 **IAM Role**을 사용하는 것을 원칙으로 합니다.
*   **운영 환경 (Production)**: 코드 내에 키를 포함하지 않고, 리소스(EC2, Lambda 등)에 연결된 **IAM Role**을 사용합니다.
*   **로컬 개발 및 테스트 (Local)**: `sts:AssumeRole`을 사용하여 운영과 유사한 권한 환경을 구성합니다.
    1. **AWS CLI 프로필 설정**: `~/.aws/config` 파일에 Role을 assume하는 프로필을 추가합니다. (실제 등록된 프로파일명이 "BedrockDevUser-hyebom" 입니다.)
       ```ini
       [profile BedrockDevUser-hyebom]
       role_arn = arn:aws:iam::626614672806:role/Bedrock-Chatbot-Role-hyebom
       source_profile = BedrockDevUser-hyebom  # 사용자 개인 자격 증명 프로필
       ```
    2. **환경 변수 지정**: 애플리케이션 실행 시 해당 프로필을 사용하도록 설정합니다.
       ```bash
       export AWS_PROFILE=bedrock-app-dev
       ```
    3. **코드 동작**: Boto3는 설정된 프로필을 감지하고 자동으로 임시 자격 증명을 받아 Role 권한으로 동작합니다.

### 2.2 의존성 설치 (Virtual Environment)
프로젝트 격리를 위해 Python 가상 환경(Virtual Environment) 사용을 권장합니다.
```bash
# 가상 환경 생성 (최초 1회)
python -m venv .venv
# 가상 환경 활성화 (Mac/Linux)
source .venv/bin/activate
# Windows: .venv\Scripts\activate
# 의존성 설치
pip install boto3 botocore streamlit

```
## 3. 아키텍처 및 구현 가이드

### 3.1 Bedrock Client 연결
Boto3를 사용하여 Bedrock Runtime 클라이언트를 생성합니다. 본 프로젝트는 **서울 리전(`ap-northeast-2`)**을 사용합니다.

### 3.2 모델 선택 및 설정
**서울 리전(`ap-northeast-2`)**에서 지원하는 최신 모델 정보를 반영했습니다.

### 3.2 모델 선택 및 설정
**서울 리전(`ap-northeast-2`)**에서 사용할 수 있는 모델 정보입니다.
*   **Amazon Nova Lite**: `apac.amazon.nova-lite-v1:0`
*   **Anthropic Claude 3.5 Sonnet**: `anthropic.claude-3-5-sonnet-20240620-v1:0`
*   **Anthropic Claude 4.5 Sonnet**: `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
**추론 파라미터 (Chat Agent 최적화)**
대화형 에이전트에 적합한 파라미터 구성입니다.
*   `temperature`: **0.7** (적절한 창의성)
*   `top_p`: **0.9** (다양한 어휘 사용)
*   `max_tokens`: **4096** (긴 답변 허용)

### 3.3 대화형 API (Converse API) 활용
단순 `invoke_model` 대신 `converse` 또는 `converse_stream` API 사용을 권장합니다.
- **System Prompt (페르소나 및 제약조건)**
  시스템 프롬프트를 통해 에이전트의 역할과 행동을 구체적으로 정의해야 합니다.
  *   **역할 정의**: "당신은 유용한 AI 어시스턴트입니다." (구체적인 역할 부여 권장)
  *   **톤 앤 매너**: "친절하고 전문적인 어조를 유지하되, 답변은 간결하고 명확하게 하세요."
  *   **제약 조건**: "사실에 기반하여 답변하고, 불확실한 내용은 추측하지 마세요. Markdown 포맷을 적극 활용하여 가독성을 높이세요."
- **Messages**: 대화 이력(`role`: `user` | `assistant`)을 관리하여 멀티턴 대화를 구현합니다.

### 3.4 스트리밍 처리
사용자 경험(UX) 향상을 위해 `converse_stream`을 사용하여 토큰 단위로 응답을 출력하도록 구현합니다.

## 4. 코드 스타일 및 컨벤션
- **Python**: `.agent/rules/python-code-style.md` 규약을 따릅니다.
- **Error Handling**: `ClientError`(Throttling, AccessDenied)에 대한 예외 처리를 반드시 구현합니다.
- **Logging**: 주요 API 호출 및 에러 상황에 대한 로깅을 남깁니다.

## 5. 배포 및 운영
- 프로덕션 배포 시 IAM 권한(`bedrock:InvokeModel*`)을 최소 권한 원칙으로 부여합니다.
- 비용 관리를 위해 토큰 사용량을 모니터링합니다.