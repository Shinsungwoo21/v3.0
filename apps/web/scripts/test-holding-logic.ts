
import { createHolding, releaseHoldingsByUser, getHolding, Seat } from '../lib/server/holding-manager';
import * as fs from 'fs';
import * as path from 'path';

// Mock Data
const MOCK_SEAT_A: Seat[] = [{ seatId: '1층-A-1-1', row: '1', number: 1, grade: 'VIP', price: 150000, seatNumber: '1층-A-1-1' } as any];
const MOCK_SEAT_B: Seat[] = [{ seatId: '1층-B-1-1', row: '1', number: 1, grade: 'VIP', price: 150000, seatNumber: '1층-B-1-1' } as any];
const PERFORMANCE_ID = 'perf-kinky-1';
const DATE = '2026-02-10';
const TIME = '19:30';
const USER_ID = 'test-user-repeat';

async function testRepeatBooking() {
    console.log("=== Test Start ===");

    // Clean start
    releaseHoldingsByUser(USER_ID);

    // Step 1: Hold A
    console.log("\n[Step 1] Hold Seat A");
    const res1 = createHolding(PERFORMANCE_ID, MOCK_SEAT_A, USER_ID, DATE, TIME);
    if (!res1.success) {
        console.error("Step 1 Failed:", res1.error);
        return;
    }
    console.log("Step 1 Success. Holding ID:", res1.holdingId);

    // Step 2: Hold B (Should auto-release A)
    console.log("\n[Step 2] Hold Seat B (Auto-release A)");
    // Manually call release first as per tool implementation
    const releasedIds2 = releaseHoldingsByUser(USER_ID);
    console.log("Released IDs:", releasedIds2);

    // Check if A is really gone
    if (getHolding(res1.holdingId!) !== null) {
        console.error("Error: Seat A holding should be gone.");
    }

    const res2 = createHolding(PERFORMANCE_ID, MOCK_SEAT_B, USER_ID, DATE, TIME);
    if (!res2.success) {
        console.error("Step 2 Failed:", res2.error);
        return;
    }
    console.log("Step 2 Success. Holding ID:", res2.holdingId);


    // Step 3: Hold A again (Should auto-release B)
    console.log("\n[Step 3] Hold Seat A again (Auto-release B)");
    const releasedIds3 = releaseHoldingsByUser(USER_ID);
    console.log("Released IDs:", releasedIds3);

    // Check if B is really gone
    if (getHolding(res2.holdingId!) !== null) {
        console.error("Error: Seat B holding should be gone.");
    }

    const res3 = createHolding(PERFORMANCE_ID, MOCK_SEAT_A, USER_ID, DATE, TIME);
    if (!res3.success) {
        console.error("Step 3 Failed:", res3.error);
        console.error("Unavailable seats:", res3.unavailableSeats);

        // Debug: Check who holds it
        const holdingData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/seat-holdings.json'), 'utf-8'));
        const conflict = holdingData.holdings.find((h: any) => h.seats.some((s: any) => s.seatId === '1층-A-1-1'));
        if (conflict) {
            console.log("Conflict Holder:", conflict.userId, conflict.holdingId);
        }

        return;
    }
    console.log("Step 3 Success. Holding ID:", res3.holdingId);

    console.log("\n=== Test Passed ===");
}

testRepeatBooking();
