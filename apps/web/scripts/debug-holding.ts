
import { createHolding } from '../lib/server/holding-manager';

const performanceId = "perf-phantom-of-the-opera-1";
const date = "2026-04-16";
const time = "19:30";
const userId = "test-user";
const seats = [
    { seatId: "1층-B-1-1", row: "1", number: 1, grade: "VIP", price: 150000 }
];

console.log("Testing createHolding with:", { performanceId, date, time });
const result = createHolding(performanceId, seats, userId, date, time);
console.log("Result:", result);
