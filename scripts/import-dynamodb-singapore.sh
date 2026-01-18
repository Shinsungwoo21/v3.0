#!/bin/bash
# DynamoDB 데이터 Import 스크립트 (싱가포르 리전)
# 사용법: bash import-dynamodb-singapore.sh

REGION="ap-southeast-1"
OLD_TABLE="plcr-gtbl-performances"
NEW_TABLE="MegaTicket-Hybrid-performances"

echo "=== 싱가포르 DynamoDB 데이터 Import ==="
echo "Region: $REGION"
echo "Table: $NEW_TABLE"
echo ""

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")"

# JSON 파일들 처리
for file in musicals-complete.json concerts-complete.json plays-complete.json; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # 테이블 이름 치환하여 임시 파일 생성
        sed "s/$OLD_TABLE/$NEW_TABLE/g" "$file" > "temp_$file"
        
        # DynamoDB에 데이터 삽입
        aws dynamodb batch-write-item \
            --request-items "file://temp_$file" \
            --region $REGION
        
        if [ $? -eq 0 ]; then
            echo "✅ $file 완료"
        else
            echo "❌ $file 실패"
        fi
        
        # 임시 파일 삭제
        rm -f "temp_$file"
    else
        echo "⚠️ $file 파일 없음"
    fi
done

echo ""
echo "=== Import 완료 ==="
