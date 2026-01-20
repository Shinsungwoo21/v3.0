#!/bin/bash
# =============================================================================
# Start Application Script (CodeDeploy - AfterInstall Hook)
# =============================================================================

set -e

echo "=== Starting Application: $(date) ==="

APP_DIR=/home/ec2-user/app

# 환경변수 로드
source /home/ec2-user/app-env.sh 2>/dev/null || true
source /home/ec2-user/.bashrc 2>/dev/null || true
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 앱 디렉토리로 이동
cd $APP_DIR

# 의존성 설치 (production only)
echo "Installing production dependencies..."
npm ci --omit=dev

# PM2로 앱 시작
echo "Starting application with PM2..."
pm2 start npm --name "mega-ticket-app" -- start

# PM2 상태 저장 (재부팅 시 자동 시작)
pm2 save

echo "=== Application Started: $(date) ==="
pm2 status
