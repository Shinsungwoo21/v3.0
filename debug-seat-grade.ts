
import { getPerformance } from './apps/app/lib/server/performance-service';

async function test() {
    try {
        console.log("Loading performance perf-kinky-1...");
        const perf = await getPerformance('perf-kinky-1');
        if (!perf) {
            console.error("Performance not found!");
            return;
        }

        console.log("Checking gradeMapping...");
        if (perf.gradeMapping) {
            console.log("gradeMapping keys:", Object.keys(perf.gradeMapping));

            const opRows = perf.gradeMapping['OP'] || [];
            const vipRows = perf.gradeMapping['VIP'] || [];

            console.log("'B-OP' in OP rows:", opRows.includes('B-OP'));
            console.log("'B-OP' in VIP rows:", vipRows.includes('B-OP'));

            if (vipRows.includes('B-OP')) {
                console.warn("WARNING: 'B-OP' is improperly listed in VIP rows!");
            }
        } else {
            console.log("No gradeMapping found.");
        }

    } catch (error) {
        console.error("Error executing test:", error);
    }
}

test();
