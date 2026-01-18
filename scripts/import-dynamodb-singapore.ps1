# DynamoDB 데이터 Import 스크립트 (싱가포르 리전) - PowerShell 버전
# 사용법: .\import-dynamodb-singapore.ps1

$REGION = "ap-southeast-1"
$OLD_TABLE = "plcr-gtbl-performances"
$NEW_TABLE = "MegaTicket-Hybrid-performances"

Write-Host "=== 싱가포르 DynamoDB 데이터 Import ===" -ForegroundColor Cyan
Write-Host "Region: $REGION"
Write-Host "Table: $NEW_TABLE"
Write-Host ""

# 스크립트 디렉토리로 이동
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# JSON 파일들 처리
$files = @("musicals-complete.json", "concerts-complete.json", "plays-complete.json")

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        # 파일 내용 읽기 및 테이블 이름 치환
        $content = Get-Content $file -Raw -Encoding UTF8
        $newContent = $content -replace $OLD_TABLE, $NEW_TABLE
        
        # 임시 파일 생성
        $tempFile = "temp_$file"
        $newContent | Out-File -FilePath $tempFile -Encoding UTF8
        
        # DynamoDB에 데이터 삽입
        try {
            aws dynamodb batch-write-item --request-items "file://$tempFile" --region $REGION
            Write-Host "OK $file 완료" -ForegroundColor Green
        }
        catch {
            Write-Host "FAIL $file 실패: $_" -ForegroundColor Red
        }
        
        # 임시 파일 삭제
        Remove-Item $tempFile -ErrorAction SilentlyContinue
    }
    else {
        Write-Host "WARNING $file 파일 없음" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Import 완료 ===" -ForegroundColor Cyan
