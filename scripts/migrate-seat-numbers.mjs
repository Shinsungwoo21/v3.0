/**
 * 좌석 번호 마이그레이션 스크립트
 * 
 * 변경 내용:
 * - A구역: 1~12번 (유지)
 * - B구역: 1~14번 → 13~26번 (+12 오프셋)
 * - C구역: 1~12번 → 25~36번 (+24 오프셋)
 * 
 * 실행: $env:AWS_PROFILE='BedrockDevUser-hyebom'; node scripts/migrate-seat-numbers.mjs
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const docClient = DynamoDBDocumentClient.from(client);

const VENUES_TABLE = process.env.DYNAMODB_VENUES_TABLE || "KDT-Msp4-PLDR-venues";
const VENUE_ID = 'charlotte-theater';

// 구역별 좌석 번호 오프셋
const SECTION_OFFSETS = {
    'A': 0,   // A구역: 1~12 (그대로)
    'B': 12,  // B구역: 13~26 (+12)
    'C': 24   // C구역: 25~36 (+24)
};

const run = async () => {
    console.log('🔄 좌석 번호 마이그레이션 시작...\n');

    // 1. 현재 데이터 조회
    const getCmd = new GetCommand({ TableName: VENUES_TABLE, Key: { venueId: VENUE_ID } });
    const { Item: venue } = await docClient.send(getCmd);

    if (!venue || !venue.sections) {
        console.log('❌ 공연장 데이터를 찾을 수 없습니다.');
        return;
    }

    // 2. 각 섹션의 좌석 번호 업데이트
    const updatedSections = venue.sections.map(section => {
        const sectionId = section.sectionId;
        const offset = SECTION_OFFSETS[sectionId] || 0;

        if (offset === 0) {
            console.log(`✓ ${sectionId}구역: 변경 없음 (오프셋 0)`);
            return section;
        }

        console.log(`🔧 ${sectionId}구역: +${offset} 오프셋 적용 중...`);

        const updatedRows = section.rows.map(row => {
            const updatedSeats = row.seats.map(seat => {
                const oldNumber = seat.seatNumber;
                const newNumber = oldNumber + offset;

                // seatId도 업데이트: 1층-B-1-1 → 1층-B-1-13
                const parts = seat.seatId.split('-');
                parts[3] = String(newNumber);
                const newSeatId = parts.join('-');

                return {
                    ...seat,
                    seatNumber: newNumber,
                    seatId: newSeatId
                };
            });

            return {
                ...row,
                seats: updatedSeats
            };
        });

        // 첫 번째와 마지막 좌석 로그
        const firstSeat = updatedRows[0]?.seats?.[0];
        const lastSeat = updatedRows[0]?.seats?.slice(-1)[0];
        console.log(`   ${sectionId}구역 1열: ${firstSeat?.seatId} ~ ${lastSeat?.seatId}`);

        return {
            ...section,
            rows: updatedRows
        };
    });

    // 3. 업데이트된 데이터 저장
    const updatedVenue = {
        ...venue,
        sections: updatedSections
    };

    console.log('\n💾 데이터 저장 중...');

    const putCmd = new PutCommand({
        TableName: VENUES_TABLE,
        Item: updatedVenue
    });

    await docClient.send(putCmd);

    console.log('\n✅ 마이그레이션 완료!');
    console.log('\n📋 결과 요약:');
    console.log('- A구역: 1~12번 (변경 없음)');
    console.log('- B구역: 13~26번 (+12 적용)');
    console.log('- C구역: 25~36번 (+24 적용)');
};

run().catch(console.error);
