import { NextResponse } from 'next/server';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function GET() {
    try {
        // 실제 존재하는 테이블명을 사용하여 DB 연결 확인
        const tableName = "plcr-gtbl-performances";
        await dynamodb.send(new DescribeTableCommand({
            TableName: tableName
        }));

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
