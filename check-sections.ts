
import { getPerformance, getVenue } from './apps/app/lib/server/performance-service';

async function checkSections() {
    const performanceId = 'perf-kinky-1';
    console.log(`Loading performance: ${performanceId}`);

    const perf = await getPerformance(performanceId);
    let sections = perf?.sections || [];

    if (sections.length === 0 && perf?.venueId) {
        console.log(`Sections empty in perf, fetching venue: ${perf.venueId}`);
        const venue = await getVenue(perf.venueId);
        sections = venue?.sections || [];
    }

    console.log(`Total sections found: ${sections.length}`);

    sections.forEach((s: any, idx: number) => {
        console.log(`Section ${idx + 1}: Floor="${s.floor}", ID="${s.sectionId || s.id}", Rows=${s.rows?.length}`);
    });

    const has2ndFloor = sections.some((s: any) => s.floor === '2층');
    if (has2ndFloor) {
        console.log("\n✅ 2nd Floor sections detected.");
    } else {
        console.log("\n⚠️ NO 2nd Floor sections found.");
    }
}

checkSections();
