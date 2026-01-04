/**
 * 좌석 번호 마이그레이션 수정 스크립트
 * 
 * 올바른 좌석 배치:
 * - A구역: 1~12번
 * - B구역 OP열: 1~12번 (OP석은 B구역에만 있으므로 유지!)
 * - B구역 일반열(1~17열): 13~26번 (14석)
 * - C구역: 25~36번 (12석)
 * 
 * 실행: $env:AWS_PROFILE='BedrockDevUser-hyebom'; node scripts/fix-seat-numbers.mjs
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const docClient = DynamoDBDocumentClient.from(client);

const VENUES_TABLE = process.env.DYNAMODB_VENUES_TABLE || "KDT-Msp4-PLDR-venues";
const VENUE_ID = 'charlotte-theater';

const run = async () => {
    console.log('🔄 좌석 번호 수정 시작...\n');

    // 1. 현재 데이터 조회
    const getCmd = new GetCommand({ TableName: VENUES_TABLE, Key: { venueId: VENUE_ID } });
    const { Item: venue } = await docClient.send(getCmd);

    if (!venue || !venue.sections) {
        console.log('❌ 공연장 데이터를 찾을 수 없습니다.');
        return;
    }

    let totalSeats = 0;

    // 2. 각 섹션의 좌석 번호 수정
    const updatedSections = venue.sections.map(section => {
        const sectionId = section.sectionId;

        console.log(`\n📍 ${sectionId}구역 처리 중...`);

        const updatedRows = section.rows.map(row => {
            const rowId = row.rowId;
            let offset = 0;

            // 구역별, 열별 오프셋 결정
            if (sectionId === 'A') {
                offset = 0; // A구역: 1~12번
            } else if (sectionId === 'B') {
                if (rowId === 'OP') {
                    offset = 0; // B구역 OP열: 1~12번 유지
                } else {
                    offset = 12; // B구역 일반열: 13~26번
                }
            } else if (sectionId === 'C') {
                offset = 24; // C구역: 25~36번
            } else if (sectionId === 'D') {
                offset = 0; // D구역 (2층 좌측)
            } else if (sectionId === 'E') {
                if (rowId === 'OP') {
                    offset = 0; // E구역 OP열: 있으면 1~12번
                } else {
                    offset = 12; // E구역 일반열: 13~26번
                }
            } else if (sectionId === 'F') {
                offset = 24; // F구역: 25~36번
            }

            const updatedSeats = row.seats.map((seat, idx) => {
                // 새 좌석 번호 = 인덱스 + 1 + 오프셋
                const newNumber = idx + 1 + offset;

                // seatId 재구성: [층]-[구역]-[열]-[번호]
                const parts = seat.seatId.split('-');
                const floor = parts[0];
                const newSeatId = `${floor}-${sectionId}-${rowId}-${newNumber}`;

                return {
                    ...seat,
                    seatNumber: newNumber,
                    seatId: newSeatId
                };
            });

            totalSeats += updatedSeats.length;

            // 첫 번째와 마지막 좌석 로그
            const firstSeat = updatedSeats[0];
            const lastSeat = updatedSeats.slice(-1)[0];
            console.log(`   ${rowId}열: ${firstSeat?.seatId} ~ ${lastSeat?.seatId} (${updatedSeats.length}석)`);

            return {
                ...row,
                seats: updatedSeats
            };
        });

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
    console.log(`\n📊 총 좌석 수: ${totalSeats}석`);
    console.log('\n📋 결과 요약:');
    console.log('- A구역: 1~12번');
    console.log('- B구역 OP열: 1~12번 (유지)');
    console.log('- B구역 일반열: 13~26번');
    console.log('- C구역: 25~36번');
    console.log('- D구역: 1~12번');
    console.log('- E구역 OP열: 1~12번');
    console.log('- E구역 일반열: 13~26번');
    console.log('- F구역: 25~36번');
};

run().catch(console.error);
