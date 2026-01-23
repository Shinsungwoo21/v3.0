import { NextResponse } from 'next/server';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function GET() {
    try {
        // 서비스 운영에 필요한 모든 주요 테이블의 연결 상태 전수 점검
        const tables = [
            "plcr-gtbl-users",
            "plcr-gtbl-performances",
            "plcr-gtbl-reservations",
            "plcr-gtbl-schedules",
            "plcr-gtbl-venues"
        ];

        for (const tableName of tables) {
            await dynamodb.send(new DescribeTableCommand({
                TableName: tableName
            }));
        }

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'api-server',
            region: process.env.AWS_REGION || 'ap-northeast-2'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown'
        }, { status: 503 });
    }
}
