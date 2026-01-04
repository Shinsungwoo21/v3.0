
import { getPerformance, getSeatInfo } from './apps/app/lib/server/performance-service';

// Mock dependencies
const getSeatStatusMap = async (pid: string, date: string, time: string) => {
    const map: Record<string, string> = {};
    // Add 12 OP seats
    for (let i = 1; i <= 12; i++) map[`1층-B-OP-${i}`] = 'available';
    // Add 12 VIP seats
    for (let i = 1; i <= 12; i++) map[`1층-B-1-${i}`] = 'available';
    return map;
};

// Copy of getAvailableSeats logic (UPDATED with new fixes)
async function getAvailableSeatsLines(input: any) {
    let { performanceId, date, time, scheduleId, grade: requestedGrade, count } = input;

    // Dependencies
    const statusMap = await getSeatStatusMap(performanceId, date, time);
    const gradeInfo: Record<string, { price: number; seats: string[] }> = {};
    const perf = await getPerformance(performanceId);
    const seatGrades = perf?.seatGrades || [];
    let sections = perf?.sections || [];
    const priceMap = new Map<string, number>();
    seatGrades.forEach((g: any) => priceMap.set(g.grade, g.price || 0));
    const hasOPSeats = (perf as any)?.hasOPSeats ?? true;

    // [V8.10] 등급 정규화 Helper (Copied from seat-tools.ts)
    const normalizeGrade = (g: string) => {
        if (!g) return null;
        const lower = g.toLowerCase().trim();
        const map: Record<string, string> = {
            'vip': 'VIP', 'vip석': 'VIP', 'vip좌석': 'VIP',
            'op': 'OP', 'op석': 'OP', '최전방': 'OP',
            'r': 'R', 'r석': 'R',
            's': 'S', 's석': 'S',
            'a': 'A', 'a석': 'A'
        };
        return map[lower] || g.replace(/석$/, '').toUpperCase();
    };

    const targetGrade = requestedGrade ? normalizeGrade(requestedGrade) : null;
    console.log(`[getAvailableSeats] requestedGrade="${requestedGrade}" -> targetGrade="${targetGrade}"`);

    // seatId -> grade mapping
    Object.entries(statusMap)
        .filter(([_, status]) => status === 'available')
        .forEach(([seatId]) => {
            const parts = seatId.split('-');
            const rowId = parts.length >= 3 ? parts[2] : '';
            if (rowId === 'OP' && !hasOPSeats) return;

            const { grade } = getSeatInfo(seatId, sections);

            // [V8.10] 강력한 등급 필터링 방어 로직 (Copied)
            if (targetGrade === 'VIP' && grade === 'OP') {
                console.log(`[Simulation] Skipping OP seat ${seatId} because VIP was requested`);
                return;
            }

            const price = priceMap.get(grade) || 0;
            if (!gradeInfo[grade]) {
                gradeInfo[grade] = { price, seats: [] };
            }
            gradeInfo[grade].seats.push(seatId);
        });

    console.log("DEBUG: gradeInfo keys:", Object.keys(gradeInfo));

    const standardOrder = ['OP', 'VIP', 'R', 'S', 'A'];
    const sortedGrades = Object.keys(gradeInfo).sort((a, b) => {
        const idxA = standardOrder.indexOf(a);
        const idxB = standardOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return 0;
    });

    const gradesToRecommend = targetGrade
        ? sortedGrades.filter(g => normalizeGrade(g) === targetGrade)
        : sortedGrades;

    console.log("DEBUG: gradesToRecommend:", gradesToRecommend);
    return gradesToRecommend;
}

async function test() {
    console.log("--- Simulation Start (Updated Logic) ---");
    const input = {
        performanceId: 'perf-kinky-1',
        date: '2026-02-10',
        time: '19:30',
        grade: 'VIP',
        count: 1
    };

    const recommendedGrades = await getAvailableSeatsLines(input);

    if (recommendedGrades.includes('OP')) {
        console.error("FAIL: OP included when VIP requested");
    } else {
        console.log("PASS: OP not included when VIP requested");
    }

    // Double check: if I request OP, it should return OP
    console.log("\n--- Testing OP Request ---");
    const inputOP = { ...input, grade: 'OP' };
    const recommendedGradesOP = await getAvailableSeatsLines(inputOP);
    if (recommendedGradesOP.includes('OP')) {
        console.log("PASS: OP included when OP requested");
    } else {
        console.error("FAIL: OP not included when OP requested");
    }
}

test();
