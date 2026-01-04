/**
 * 좌석 번호 롤백 스크립트
 * 
 * 원래 상태로 복원:
 * - 모든 구역, 모든 열에서 좌석 번호를 1번부터 시작하도록 복원
 * 
 * 실행: $env:AWS_PROFILE='BedrockDevUser-hyebom'; node scripts/rollback-seat-numbers.mjs
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const docClient = DynamoDBDocumentClient.from(client);

const VENUES_TABLE = process.env.DYNAMODB_VENUES_TABLE || "KDT-Msp4-PLDR-venues";
const VENUE_ID = 'charlotte-theater';

const run = async () => {
    console.log('🔄 좌석 번호 롤백 시작...\n');

    // 1. 현재 데이터 조회
    const getCmd = new GetCommand({ TableName: VENUES_TABLE, Key: { venueId: VENUE_ID } });
    const { Item: venue } = await docClient.send(getCmd);

    if (!venue || !venue.sections) {
        console.log('❌ 공연장 데이터를 찾을 수 없습니다.');
        return;
    }

    let totalSeats = 0;

    // 2. 모든 좌석 번호를 1번부터 시작하도록 복원
    const updatedSections = venue.sections.map(section => {
        const sectionId = section.sectionId;
        const floor = sectionId <= 'C' ? '1층' : '2층';

        console.log(`\n📍 ${sectionId}구역 롤백 중...`);

        const updatedRows = section.rows.map(row => {
            const rowId = row.rowId;

            // 모든 좌석을 1번부터 순서대로
            const updatedSeats = row.seats.map((seat, idx) => {
                const newNumber = idx + 1;
                const newSeatId = `${floor}-${sectionId}-${rowId}-${newNumber}`;

                return {
                    ...seat,
                    seatNumber: newNumber,
                    seatId: newSeatId
                };
            });

            totalSeats += updatedSeats.length;

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

    // 3. 복원된 데이터 저장
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

    console.log('\n✅ 롤백 완료!');
    console.log(`\n📊 총 좌석 수: ${totalSeats}석`);
    console.log('\n📋 모든 구역, 모든 열에서 좌석 번호가 1번부터 시작합니다.');
};

run().catch(console.error);
