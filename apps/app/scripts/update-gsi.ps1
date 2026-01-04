
$tableName = "KDT-Msp4-PLDR-schedules"
$indexName = "performanceId-index"
$region = "ap-northeast-2"

Write-Host "1. Deleting GSI '$indexName' from table '$tableName'..."
aws dynamodb update-table --table-name $tableName --region $region --global-secondary-index-updates file://c:/bedrock_space/apps/app/scripts/delete-index.json --no-cli-pager

Write-Host "Waiting for GSI deletion..."
while ($true) {
    Start-Sleep -Seconds 5
    $table = aws dynamodb describe-table --table-name $tableName --region $region --no-cli-pager | ConvertFrom-Json
    $gsi = $table.Table.GlobalSecondaryIndexes | Where-Object { $_.IndexName -eq $indexName }
    
    if (-not $gsi) {
        Write-Host "GSI deleted successfully."
        break
    }
    if ($gsi.IndexStatus -eq "DELETING") {
        Write-Host "Status: DELETING..."
    } else {
        # If it exists but not deleting, maybe delete failed or not started?
        Write-Host "Status: $($gsi.IndexStatus) (Waiting for deletion)"
    }
}

Write-Host "2. Creating GSI '$indexName' with Sort Key 'date'..."
aws dynamodb update-table --table-name $tableName --region $region --global-secondary-index-updates file://c:/bedrock_space/apps/app/scripts/create-index.json --no-cli-pager

Write-Host "Waiting for GSI creation (ACTIVE status)..."
while ($true) {
    Start-Sleep -Seconds 5
    $table = aws dynamodb describe-table --table-name $tableName --region $region --no-cli-pager | ConvertFrom-Json
    $gsi = $table.Table.GlobalSecondaryIndexes | Where-Object { $_.IndexName -eq $indexName }

    if ($gsi -and $gsi.IndexStatus -eq "ACTIVE") {
        Write-Host "GSI created successfully and is ACTIVE."
        break
    }
    if ($gsi) {
        Write-Host "Status: $($gsi.IndexStatus)..."
    } else {
        Write-Host "GSI not found yet..."
    }
}

Write-Host "Done! DB Optimization Complete."
