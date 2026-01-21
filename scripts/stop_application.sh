#!/bin/bash
# =============================================================================
# Stop Application Script (CodeDeploy - ApplicationStop Hook)
# =============================================================================

set -e

echo "=== Stopping Application: $(date) ==="

# 환경변수 로드
source /home/ec2-user/app-env.sh 2>/dev/null || true
source /home/ec2-user/.bashrc 2>/dev/null || true
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# PM2로 앱 중지
if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 processes..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    echo "PM2 processes stopped."
else
    echo "PM2 not found, skipping..."
fi

echo "=== Application Stopped: $(date) ==="
exit 0
