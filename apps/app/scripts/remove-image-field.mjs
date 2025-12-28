/**
 * V7.11: performances 테이블에서 image 필드 제거 (poster만 유지)
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-northeast-2",
    ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT })
});
const dynamodb = DynamoDBDocumentClient.from(client);
const PERFORMANCES_TABLE = process.env.DYNAMODB_PERFORMANCES_TABLE || "KDT-Msp4-PLDR-performances";

async function removeImageField() {
    console.log("=== V7.11: image 필드 제거 시작 ===");
    console.log(`테이블: ${PERFORMANCES_TABLE}\n`);

    try {
        const result = await dynamodb.send(new ScanCommand({ TableName: PERFORMANCES_TABLE }));
        const performances = result.Items || [];
        console.log(`총 ${performances.length}개 공연 발견\n`);

        let removedCount = 0;
        for (const perf of performances) {
            if (perf.image) {
                await dynamodb.send(new UpdateCommand({
                    TableName: PERFORMANCES_TABLE,
                    Key: { performanceId: perf.performanceId },
                    UpdateExpression: "REMOVE image"
                }));
                console.log(`[REMOVED] ${perf.performanceId}: image 필드 삭제`);
                removedCount++;
            } else {
                console.log(`[SKIP] ${perf.performanceId}: image 필드 없음`);
            }
        }

        console.log(`\n=== 완료: ${removedCount}개 공연에서 image 필드 삭제 ===`);
    } catch (error) {
        console.error("오류 발생:", error);
        process.exit(1);
    }
}

removeImageField();
