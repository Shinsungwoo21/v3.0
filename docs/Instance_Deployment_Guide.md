# MegaTicket 인스턴스 배포 가이드 (Node.js)

Docker를 사용하지 않고, AWS EC2 등 일반적인 리눅스 인스턴스에서 Node.js 환경으로 직접 배포하는 절차입니다.

---

## 1. 사전 준비: Node.js 설치 (NVM 사용)

Node.js가 설치되어 있지 않은 경우, 가장 안정적인 **NVM (Node Version Manager)** 을 통해 설치합니다. (권장 버전: v24.12.0)

```bash
# 1. NVM 설치 스크립트 실행
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 2. NVM 활성화 (터미널 재시작 없이 바로 적용)
. ~/.nvm/nvm.sh

# 3. Node.js 설치 (로컬 개발 환경과 동일한 버전 권장)
nvm install 24.12.0

# 4. 설치 확인 (버전이 출력되면 성공)
node -v
npm -v
```

---

## 2. 공통 준비: 소스 코드 및 의존성 설치

Web, App 인스턴스 모두 공통적으로 수행해야 하는 단계입니다.

```bash
# 1. 홈 디렉터리로 이동 및 기존 폴더 정리 (선택사항: 클린 설치 시)
cd ~
rm -rf megaticket 

# 2. 소스 코드 복제
git clone https://github.com/seolhyebom/megaticket.git
cd megaticket

# 3. 전체 의존성 설치 (필수: Monorepo의 모든 패키지 설치)
npm install
```

> **주의**: 반드시 `megaticket` 루트 폴더에서 `npm install`을 먼저 수행해야 합니다.

---

## 3. 인스턴스별 실행 가이드

### A. Web 인스턴스 (Frontend) - Port 3000

프론트엔드 서버를 구동합니다.

```bash
# 1. Web 폴더로 이동
cd apps/web

# 2. 환경변수 설정 (DR 적용 시 ap-northeast-1)
export AWS_REGION=ap-northeast-2

# 3. 빌드
npm run build

# 4. 실행
npm start
```

### B. App 인스턴스 (Backend) - Port 3001

백엔드 API 서버를 구동합니다. `DR_RECOVERY_MODE`는 이곳에서만 설정합니다.

```bash
# 1. App 폴더로 이동
cd apps/app

# 2. 환경변수 설정
export AWS_REGION=ap-northeast-2

# (선택) 장애 복구 테스트 시에만 아래 주석 해제하여 설정 (기본값: false)
# export DR_RECOVERY_MODE=true

# 3. 빌드
npm run build

# 4. 실행
npm start
```
