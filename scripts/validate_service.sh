#!/bin/bash
# =============================================================================
# Validate Service Script (CodeDeploy - ValidateService Hook)
# =============================================================================

set -e

echo "=== Validating Service: $(date) ==="

# 환경변수 로드
source /home/ec2-user/app-env.sh 2>/dev/null || true

PORT=${PORT:-3001}
MAX_RETRIES=10
RETRY_INTERVAL=3

echo "Checking health endpoint on port $PORT..."

for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i of $MAX_RETRIES..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Health check passed! HTTP $HTTP_CODE"
        echo "=== Service Validated: $(date) ==="
        exit 0
    fi
    
    echo "Health check returned HTTP $HTTP_CODE, retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
