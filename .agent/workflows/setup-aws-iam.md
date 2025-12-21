---
description: AWS IAM Setup for Bedrock (IAM Role & Local Assume Role)
---

# AWS IAM Setup Guide for Bedrock Application

이 문서는 Bedrock 애플리케이션 개발을 위한 안전한 IAM 구성 방법을 안내합니다. 운영 환경(EC2/Lambda)에서는 IAM Role을 직접 연결하고, 로컬 개발 환경에서는 `AssumeRole`을 사용하여 임시 권한을 획득하는 흐름입니다.

## 1. 사전 준비 (Prerequisites)
- AWS Management Console 접근 권한
- AWS CLI 설치 및 `default` 프로필 설정 (`aws configure`)
  - `default` 프로필은 IAM User의 Access Key를 가지고 있어야 하며, Role을 Assume할 수 있는 권한이 필요합니다.

## 2. AWS Management Console 작업

### 2.1 IAM 정책 생성 (Create IAM Policy)
Bedrock 모델을 호출할 수 있는 최소 권한 정책을 생성합니다.

1.  **IAM > Policies** 이동
2.  **Create policy** 클릭
3.  **JSON** 탭 선택 후 아래 내용 입력:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream"
                ],
                "Resource": "arn:aws:bedrock:ap-northeast-2::foundation-model/*"
            }
        ]
    }
    ```
    *(참고: 특정 모델만 허용하려면 Resource ARN을 구체적으로 명시하세요)*
4.  Policy Name: `BedrockInvokePolicy`

### 2.2 IAM 역할 생성 (Create IAM Role)
애플리케이션이 사용할 역할을 생성합니다.

1.  **IAM > Roles** 이동
2.  **Create role** 클릭
3.  **Trusted entity type** 선택:
    - **AWS service**: EC2, Lambda 등에서 실행할 경우 해당 서비스 선택.
    - (로컬 테스트를 위해 나중에 Trust Policy를 수정할 것이므로 일단 **AWS Service > EC2** 등으로 생성해도 무방합니다.)
4.  **Permissions** 단계에서 앞서 만든 `BedrockInvokePolicy` 검색 후 체크.
5.  Role Name: `BedrockExecutionRole` (예시)
6.  Role ARN 확인 (예: `arn:aws:iam::123456789012:role/BedrockExecutionRole`) -> **메모해두세요.**

### 2.3 신뢰 관계 수정 (Edit Trust Relationship)
로컬 PC의 IAM User(예: `DeveloperUser`)가 이 Role을 Assume할 수 있도록 허용해야 합니다.

1.  생성된 `BedrockExecutionRole` 상세 페이지로 이동
2.  **Trust relationships** 탭 > **Edit trust policy** 클릭
3.  아래와 같이 `Principal`에 개발자 IAM User ARN을 추가합니다.
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ec2.amazonaws.com",
                    "AWS": "arn:aws:iam::123456789012:user/DeveloperUser"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    ```
    - `"Service": "ec2.amazonaws.com"`: EC2에서 실행 시 필요
    - `"AWS": "arn:aws:iam::...:user/..."`: 로컬 개발자가 AssumeRole 할 때 필요

## 3. 로컬 환경 설정 (Local Setup)

### 3.1 AWS CLI Config 설정
`~/.aws/config` 파일을 열어 `step 1`에서 메모한 Role ARN을 연결하는 프로필을 추가합니다.

**파일 경로:**
- Windows: `%USERPROFILE%\.aws\config`
- Mac/Linux: `~/.aws/config`

**추가할 내용:**
```ini
[profile bedrock-app-dev]
role_arn = arn:aws:iam::123456789012:role/BedrockExecutionRole
source_profile = default
region = ap-northeast-2
```
- `role_arn`: 2.2에서 생성한 Role의 ARN
- `source_profile`: 현재 로컬에 `aws configure`로 설정된, Role을 Assume할 권한이 있는 사용자 프로필

### 3.2 테스트 (Verify)
설정이 올바른지 확인합니다.

```bash
# 1. 설정한 프로필로 자격 증명 확인
aws sts get-caller-identity --profile bedrock-app-dev
```
출력 결과의 `Arn`이 `...assumed-role/BedrockExecutionRole/...` 형태라면 성공입니다.

## 4. 애플리케이션 실행
코드 실행 시 `AWS_PROFILE` 환경 변수를 설정하면 Boto3가 자동으로 해당 Role을 사용합니다.

```bash
# Windows PowerShell
$env:AWS_PROFILE="bedrock-app-dev"
python src/app.py

# Mac/Linux
export AWS_PROFILE=bedrock-app-dev
python src/app.py
```
