
import { getAvailableSeats } from './apps/app/lib/tools/seat-tools';

async function test() {
    try {
        console.log("Testing getAvailableSeats logic...");
        // Mock input (Fixing date parameter)
        const input = {
            performanceId: 'perf-kinky-1',
            scheduleId: 'perf-kinky-1-20260210-1930',
            date: '2026-02-10', // Explicitly pass date
            time: '19:30',
            grade: 'VIP',
            count: 1
        };

        console.log("Calling getAvailableSeats with grade='VIP'...");
        const result = await getAvailableSeats(input);

        if (result && result.recommendedOptions) {
            console.log("Recommendations keys:", Object.keys(result.recommendedOptions));
            const vipRecs = result.recommendedOptions['VIP'] || [];
            const opRecs = result.recommendedOptions['OP'] || [];

            console.log(`VIP count: ${vipRecs.length}`);
            console.log(`OP count: ${opRecs.length}`);

            if (opRecs.length > 0 && input.grade === 'VIP') {
                console.error("ERROR: OP seats recommended when VIP requested (OP key exists)");
            }
            if (vipRecs.some((r: any) => r.label.includes('OP'))) {
                console.error("ERROR: OP seats found inside VIP recommendations!");
                console.log("Sample:", vipRecs.find((r: any) => r.label.includes('OP')));
            } else {
                console.log("VIP recommendations look clean (no OP label).");
                if (vipRecs.length > 0) {
                    console.log("Sample VIP:", vipRecs[0].label);
                }
            }
        } else {
            console.log("No recommendations returned or error:", result);
        }

    } catch (error) {
        console.error("Error executing test:", error);
    }
}

test();
