
import { getUserReservations, getSeatStatusMap } from './apps/web/lib/server/holding-manager';
import fs from 'fs';
import path from 'path';

// Mock process.cwd() if needed or adjust paths in holding-manager if it relies on it. 
// holding-manager uses process.cwd(). In this environment, it's c:\bedrock_space.
// We might need to run this with ts-node or similar, but we don't have it easily. 
// Alternatively, I can just read the file and filter manually in python to compare?
// Or write a small TS file and try to run it?
// Let's use the Python verification approach as it's more reliable in this env.

const RESERVATIONS_FILE = 'c:/bedrock_space/apps/web/data/reservations.json';
const HOLDINGS_FILE = 'c:/bedrock_space/apps/web/data/seat-holdings.json';

// Just basic check
const resData = JSON.parse(fs.readFileSync(RESERVATIONS_FILE, 'utf-8'));
console.log("Total Reservations:", resData.reservations.length);

const mockUserRes = resData.reservations.filter(r => r.userId === 'mock-user-01');
console.log("Mock User Reservations:", mockUserRes.length);
console.log("Mock User Res IDs:", mockUserRes.map(r => r.id));

const user1Res = resData.reservations.filter(r => r.userId === 'user-1');
console.log("User-1 Reservations:", user1Res.length);

// Check F-9 status logic
// performanceId: perf-1, date: 2025-12-25, time: 19:00
const perfId = 'perf-1';
const date = '2025-12-25';
const time = '19:00';

const confirmed = resData.reservations.filter(r =>
    r.performanceId === perfId &&
    r.date === date &&
    r.time === time &&
    r.status === 'confirmed'
);

console.log(`Confirmed reservations for ${perfId} ${date} ${time}:`, confirmed.length);
confirmed.forEach(r => {
    console.log("Seats:", r.seats.map(s => s.seatId).join(', '));
});
