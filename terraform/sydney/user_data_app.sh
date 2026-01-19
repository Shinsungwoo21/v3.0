#!/bin/bash
# =============================================================================
# App User Data - Sydney DR Region (V3.0 Golden AMI)
# =============================================================================
# 목적: Golden AMI 사용 시 환경변수 설정 + S3에서 아티팩트 배포
# Golden AMI에 Node.js, PM2, unzip 등이 이미 설치되어 있음
# NAT Gateway 없이 VPC Endpoint(S3)만으로 동작
# =============================================================================

set -e

exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "=== User Data Script Started: $(date) ==="

USER_HOME=/home/ec2-user
APP_DIR=/home/ec2-user/app

# =============================================================================
# 1. 환경변수 설정 파일 생성 (Terraform 변수 사용)
# =============================================================================
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
grep -q "app-env.sh" /home/ec2-user/.bashrc || echo "source /home/ec2-user/app-env.sh" >> /home/ec2-user/.bashrc

# =============================================================================
# 2. 앱 디렉토리 정리 (root 권한으로 - Golden AMI에서 root 소유 파일 삭제)
# =============================================================================
echo "=== Cleaning app directory (root permission) ==="
rm -rf $APP_DIR 2>/dev/null || true
mkdir -p $APP_DIR
chown ec2-user:ec2-user $APP_DIR

# =============================================================================
# 3. 배포 스크립트 생성
# =============================================================================
echo "=== Creating Deploy Script ==="

cat > /home/ec2-user/deploy-from-s3.sh << 'DEPLOYEOF'
#!/bin/bash
# =============================================================================
# S3 아티팩트 배포 스크립트 (DR 리전용)
# CRR로 복제된 latest/app.zip에서 다운로드 (VPC Endpoint 사용)
# =============================================================================

set -e

APP_DIR=/home/ec2-user/app

# IMDSv2로 현재 리전 조회
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
CURRENT_REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)

ARTIFACT_BUCKET="codepipeline-$CURRENT_REGION-artifacts"
TEMP_ZIP=/tmp/app-latest.zip

echo "=== Downloading artifact from S3 (Region: $CURRENT_REGION) ==="
aws s3 cp s3://$ARTIFACT_BUCKET/latest/app.zip $TEMP_ZIP --region $CURRENT_REGION

if [ ! -f "$TEMP_ZIP" ]; then
  echo "ERROR: Failed to download artifact from s3://$ARTIFACT_BUCKET/latest/app.zip"
  exit 1
fi

echo "=== Extracting artifact ==="
cd $APP_DIR
unzip -o $TEMP_ZIP
rm -f $TEMP_ZIP

echo "=== Loading environment ==="
source /home/ec2-user/app-env.sh
source /home/ec2-user/.nvm/nvm.sh

echo "=== Starting application with PM2 ==="
pm2 delete app 2>/dev/null || true
pm2 start node_modules/next/dist/bin/next --name "app" -- start -H 0.0.0.0 -p 3001
pm2 save

echo "=== Deploy completed: $(date) ==="
DEPLOYEOF

chown ec2-user:ec2-user /home/ec2-user/deploy-from-s3.sh
chmod +x /home/ec2-user/deploy-from-s3.sh

# =============================================================================
# 4. 배포 스크립트 실행
# =============================================================================
echo "=== Running Deploy Script ==="
sudo -u ec2-user bash /home/ec2-user/deploy-from-s3.sh

echo "=== User Data Script Completed: $(date) ==="
