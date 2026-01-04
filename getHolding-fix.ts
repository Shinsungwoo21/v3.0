/**
 * 4. Get holding by ID (DynamoDB Only)
 * [V8.13 FIX] totalPrice, performanceTitle, venue, 등급별 색상 추가
 * Note: Since we don't have a GSI for holdingId yet, this is a Scan (not ideal).
 * But for a small POC / MVP, we can keep it or use Query if we change index.
 */
export async function getHolding(holdingId: string): Promise<Holding | null> {
    try {
        // V7.15: GSI holdingId-index 사용하여 Query (Scan 대비 99% RCU 절감)
        const result = await dynamoDb.send(new QueryCommand({
            TableName: RESERVATIONS_TABLE,
            IndexName: 'holdingId-index',
            KeyConditionExpression: "holdingId = :hid",
            FilterExpression: "#s = :status",
            ExpressionAttributeNames: {
                "#s": "status"
            },
            ExpressionAttributeValues: {
                ":hid": holdingId,
                ":status": "HOLDING"
            }
        }));

        const items = result.Items || [];
        if (items.length === 0) return null;

        const first = items[0] as any;
        const now = new Date();
        const expiresAtISO = new Date(now.getTime() + 600 * 1000).toISOString();  // V7.22: 10분 TTL

        // [V8.13 FIX] 등급별 색상 매핑
        const gradeColors: Record<string, string> = {
            'VIP': '#9333ea',  // purple-600
            'R': '#dc2626',    // red-600
            'S': '#2563eb',    // blue-600
            'A': '#16a34a',    // green-600
            'OP': '#f97316',   // orange-500
        };

        // [V8.13 FIX] seats 매핑 시 price와 color 포함
        const seats = items.map((i: any) => ({
            seatId: (i.seatId as string) || "",
            seatNumber: (i.seatNumber as number) || 0,
            rowId: (i.rowId as string) || 'unknown',
            grade: (i.grade as string) || 'S',
            price: (i.price as number) || 0,
            color: gradeColors[(i.grade as string)] || '#333333',  // [V8.13] 등급별 색상
            status: 'holding' as any
        }));

        // [V8.13 FIX] totalPrice 계산
        const totalPrice = seats.reduce((sum, seat) => sum + (seat.price || 0), 0);

        // [V8.13 FIX] performanceTitle, venue 가져오기 (DB 저장값 우선, 없으면 조회)
        let performanceTitle = (first.performanceTitle as string) || '';
        let venue = (first.venue as string) || '';

        // DB에 저장된 값이 없으면 공연 정보에서 조회
        if (!performanceTitle || !venue) {
            try {
                const perf = await getPerformance(first.performanceId);
                if (perf) {
                    performanceTitle = performanceTitle || perf.title || "알 수 없는 공연";
                    venue = venue || (perf.venue as any)?.name || perf.venue || "샤롯데씨어터";
                }
            } catch (e) {
                console.warn('[getHolding] Failed to fetch performance info:', e);
            }
        }

        const holding: Holding = {
            holdingId: (first.holdingId as string) || holdingId,
            performanceId: (first.performanceId as string) || "",
            performanceTitle: performanceTitle,  // [V8.13 FIX] 추가
            venue: venue,                        // [V8.13 FIX] 추가
            date: (first.date as string) || "",
            time: (first.time as string) || "",
            userId: (first.userId as string) || "",
            seats: seats,
            totalPrice: totalPrice,              // [V8.13 FIX] 추가
            createdAt: (first.createdAt as string) || now.toISOString(),
            expiresAt: (first.expiresAt as string) || expiresAtISO
        };

        console.log('[getHolding] Returning holding:', {
            holdingId,
            performanceTitle,
            venue,
            totalPrice,
            seatCount: seats.length,
            seatIds: seats.map(s => s.seatId)
        });

        return holding;
    } catch (error) {
        console.error(`[HoldingManager] Error getting holding:`, error);
        return null;
    }
}
