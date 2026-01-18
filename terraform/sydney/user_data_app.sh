#!/bin/bash
# =============================================================================
# App User Data - Sydney DR Region (V3.0)
# =============================================================================
# 목적: EC2 인스턴스 시작 시 환경 설정 + S3에서 아티팩트 직접 배포
# DR 리전은 CodeDeploy 대신 S3에서 직접 아티팩트를 가져옴
# =============================================================================

set -e

# 로그 파일 설정
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "=== User Data Script Started: $(date) ==="

# 사용자 설정 (ec2-user로 실행)
USER_HOME=/home/ec2-user
APP_DIR=/home/ec2-user/app

# S3 아티팩트 설정 (Terraform 변수로 주입)
ARTIFACT_BUCKET="${artifact_bucket}"
ARTIFACT_KEY="${artifact_key}"

# 1. 필수 패키지 설치
echo "=== Installing Required Packages ==="
dnf install git ruby wget unzip -y

# 2. AWS CLI 설치 확인 (Amazon Linux 2023에는 기본 포함)
echo "=== Checking AWS CLI ==="
aws --version

# 3. ec2-user 홈 디렉토리 권한 확인
chown ec2-user:ec2-user $USER_HOME

# 4. NVM 설치 (ec2-user 권한으로)
echo "=== Installing NVM ==="
sudo -u ec2-user bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash'

# 5. Node.js 설치
echo "=== Installing Node.js ==="
sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && nvm install 24.12.0'

# 6. PM2 전역 설치
echo "=== Installing PM2 ==="
sudo -u ec2-user bash -c 'source $HOME/.nvm/nvm.sh && npm install -g pm2'

# 7. PM2 startup 설정
echo "=== Setting up PM2 Startup ==="
NODE_BIN_DIR="/home/ec2-user/.nvm/versions/node/v24.12.0/bin"
sudo env PATH=$NODE_BIN_DIR:$PATH $NODE_BIN_DIR/pm2 startup systemd -u ec2-user --hp /home/ec2-user --service-name pm2-ec2-user || true

# 8. 환경변수 설정 파일 생성
echo "=== Setting Environment Variables ==="
cat > /home/ec2-user/app-env.sh << 'ENVEOF'
export AWS_REGION=${aws_region}
export PORT=3001
export BEDROCK_REGION=${aws_region}
export DYNAMODB_RESERVATIONS_TABLE=${dynamodb_table_prefix}-reservations
export DYNAMODB_PERFORMANCES_TABLE=${dynamodb_table_prefix}-performances
export DYNAMODB_VENUES_TABLE=${dynamodb_table_prefix}-venues
export DYNAMODB_SCHEDULES_TABLE=${dynamodb_table_prefix}-schedules
export DR_RECOVERY_MODE=true
ENVEOF

chown ec2-user:ec2-user /home/ec2-user/app-env.sh
echo "source /home/ec2-user/app-env.sh" >> /home/ec2-user/.bashrc

# 9. 앱 디렉토리 생성
echo "=== Creating app directory ==="
mkdir -p $APP_DIR
chown ec2-user:ec2-user $APP_DIR

# =============================================================================
# 10. S3에서 아티팩트 다운로드 및 배포 스크립트 생성
# =============================================================================
echo "=== Creating Deploy Script ==="

cat > /home/ec2-user/deploy-from-s3.sh << 'DEPLOYEOF'
#!/bin/bash
# =============================================================================
# S3 아티팩트 배포 스크립트 (시드니 DR 리전용)
# CRR로 복제된 latest/app.zip에서 다운로드
# =============================================================================

set -e

APP_DIR=/home/ec2-user/app
ARTIFACT_BUCKET="codepipeline-ap-southeast-2-artifacts"
AWS_REGION="ap-southeast-2"
TEMP_ZIP=/tmp/app-latest.zip

echo "=== Downloading artifact from S3 (latest/app.zip) ==="
aws s3 cp s3://${ARTIFACT_BUCKET}/latest/app.zip ${TEMP_ZIP} --region ${AWS_REGION}

if [ ! -f "${TEMP_ZIP}" ]; then
  echo "ERROR: Failed to download artifact from s3://${ARTIFACT_BUCKET}/latest/app.zip"
  exit 1
fi

echo "=== Extracting artifact ==="
cd $APP_DIR
rm -rf ./* 2>/dev/null || true
unzip -o ${TEMP_ZIP}
rm -f ${TEMP_ZIP}

echo "=== Loading environment ==="
source /home/ec2-user/app-env.sh
source /home/ec2-user/.nvm/nvm.sh

echo "=== Installing dependencies ==="
npm ci --production 2>/dev/null || npm install --production

echo "=== Starting application with PM2 ==="
pm2 delete app 2>/dev/null || true
pm2 start npm --name "app" -- start
pm2 save

echo "=== Deploy completed: $(date) ==="
DEPLOYEOF

chown ec2-user:ec2-user /home/ec2-user/deploy-from-s3.sh
chmod +x /home/ec2-user/deploy-from-s3.sh

# =============================================================================
# 11. 배포 스크립트 실행
# =============================================================================
echo "=== Running Deploy Script ==="
sudo -u ec2-user bash /home/ec2-user/deploy-from-s3.sh

echo "=== User Data Script Completed: $(date) ==="
