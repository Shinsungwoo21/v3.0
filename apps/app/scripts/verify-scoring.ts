
// Scoring Logic Verification Script
// Simulating the logic from seat-tools.ts to verify correct scoring

interface SeatChunk {
    seats: string[];
    section: string;
    rowNum: number;
    centerNum: number;
    score: number;
}

// Mock Global Nums & Sections
// 1F: A (1-13), B (13-26), C (27-39)
// 2F: D (1-12), E (1-40?), F (1-12)

const sectionConfigByFloor: Record<string, Record<string, { min: number; max: number; centerType: 'middle' | 'high' | 'low'; idealCenter?: number; idealRange?: { start: number; end: number } }>> = {
    '1층': {
        'A': { min: 1, max: 13, centerType: 'high' },
        'B': { min: 13, max: 26, centerType: 'middle', idealCenter: 19.5, idealRange: { start: 18, end: 21 } },
        'C': { min: 27, max: 39, centerType: 'low' },
    },
    '2층': {
        'D': { min: 1, max: 12, centerType: 'high' },
        'E': { min: 1, max: 40, centerType: 'middle', idealCenter: 20.5, idealRange: { start: 19, end: 22 } },
        'F': { min: 1, max: 12, centerType: 'low' }
    }
};

function calculateScore(floor: string, section: string, globalNums: number[], rowNum: number): number {
    const avgGlobalNum = globalNums.reduce((a, b) => a + b, 0) / globalNums.length;
    const rowScore = 100 - rowNum;
    const floorConfig = sectionConfigByFloor[floor] || sectionConfigByFloor['1층'];
    const config = floorConfig[section];

    let centerBonus = 0;

    if (config) {
        const { min, max, centerType, idealCenter, idealRange } = config;

        if (centerType === 'middle' && idealRange && idealCenter) {
            const centerSeats = globalNums.filter(n => n >= idealRange.start && n <= idealRange.end);

            if (centerSeats.length === globalNums.length) {
                centerBonus = 80;
            } else if (centerSeats.length > 0) {
                centerBonus = 30 + (centerSeats.length / globalNums.length) * 40;
            }

            const distanceFromIdeal = Math.abs(avgGlobalNum - idealCenter);
            const proximityScore = Math.max(0, 20 - distanceFromIdeal * 3);
            centerBonus += proximityScore;
        }
        else if (centerType === 'high') {
            const ratio = (avgGlobalNum - min) / (max - min);
            const safeRatio = Math.max(0, Math.min(1, ratio));
            centerBonus = safeRatio * 60;
        }
        else if (centerType === 'low') {
            const ratio = (max - avgGlobalNum) / (max - min);
            const safeRatio = Math.max(0, Math.min(1, ratio));
            centerBonus = safeRatio * 60;
        }
    }

    let sectionScore = 0;
    if (section === 'B' || section === 'E') sectionScore = 15;
    else sectionScore = 5;

    let floorScore = 0;
    if (floor === '1층') floorScore = 20;
    else if (floor === '2층') floorScore = 10;

    return rowScore + centerBonus + sectionScore + floorScore;
}

function runTest(testName: string, floor: string, section: string, chunks: number[][], expectedBest: number[]) {
    console.log(`\n---------------------------------------------------`);
    console.log(`[TEST] ${testName} (${floor} ${section}구역)`);

    const results = chunks.map(chunk => ({
        seats: chunk,
        score: calculateScore(floor, section, chunk, 1) // row 1 assumed
    }));

    results.sort((a, b) => b.score - a.score);

    console.log("Scores:");
    results.forEach((r, i) => {
        console.log(` Rank ${i + 1}: Seats ${r.seats} -> Score ${r.score.toFixed(2)}`);
    });

    const best = results[0];
    const isSuccess = JSON.stringify(best.seats) === JSON.stringify(expectedBest);

    console.log(`Result: ${isSuccess ? '✅ PASS' : '❌ FAIL'}`);
    if (!isSuccess) {
        console.log(` Expected: ${expectedBest}`);
        console.log(` Actual: ${best.seats}`);
    }
    return isSuccess;
}

// Test Cases
const chunksB = [[16, 17, 18], [17, 18, 19], [18, 19, 20], [19, 20, 21], [20, 21, 22]];
runTest('테스트 1: 1층 B구역 정중앙 (18~20 vs 19~21)', '1층', 'B', chunksB, [18, 19, 20]); // Expected 18-20 or 19-21. 18-20 center is 19. 19-21 center is 20. Ideal 19.5. 19 is closer (0.5 diff) vs 20 (0.5 diff). Tie? Let's see code. 18-20 includes 18,19,20 (3/3). 19-21 includes 19,20,21 (3/3). Distance: |19-19.5|=0.5. |20-19.5|=0.5. Scores should be equal. Sorting usually preserves order or random. Let's see.

const chunksE = [[17, 18, 19], [18, 19, 20], [19, 20, 21], [20, 21, 22]];
// E Ideal: 20.5 (Range 19-22)
// 19-21 (Center 20, Diff 0.5, 3/3 in range)
// 20-22 (Center 21, Diff 0.5, 3/3 in range)
runTest('테스트 2: 2층 E구역 정중앙 (19~21 vs 20~22)', '2층', 'E', chunksE, [19, 20, 21]); // Expect 19-21 or 20-22

const chunksA = [[1, 2, 3], [5, 6, 7], [11, 12, 13]]; // Right(13) is best
runTest('테스트 3: 1층 A구역 (오른쪽 선호)', '1층', 'A', chunksA, [11, 12, 13]);

const chunksC = [[27, 28, 29], [33, 34, 35], [37, 38, 39]]; // Left(27) is best
runTest('테스트 4: 1층 C구역 (왼쪽 선호)', '1층', 'C', chunksC, [27, 28, 29]);
