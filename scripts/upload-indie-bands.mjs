import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Configuration
const region = "ap-northeast-2";
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERFORMANCES_FILE = path.join(__dirname, "../apps/web/indie-performances.json");

// Constants
const PERF_TABLE = "plcr-gtbl-performances";
const SCHEDULE_TABLE = "plcr-gtbl-schedules";
const TODAY = new Date().toISOString();

// Schedules Data
// Band 1: BTS replacement (2/20-22, 19:00)
// Band 2: BP replacement (3/13-15, 19:00)
// Band 3: Day6 replacement (3/27-29, 19:00)
// Band 4: IVE replacement (2/27-3/01, 19:30)

const castings = {
    "perf-jeong-o-byeol-jeom": { "indie": ["기묘말", "언더플로우"] },
    "perf-29cm-stage": { "indie": ["장기하", "양치기소년단"] },
    "perf-free-fall": { "indie": ["오예본", "우수현", "민채영"] },
    "perf-on-air": { "indie": ["디아틱", "세븐아워즈", "나타샤"] }
};

const rawSchedules = [
    // 1. Jeong (Fri-Sun 19:00)
    { pid: "perf-jeong-o-byeol-jeom", date: "2026-02-20", time: "19:00", day: "금" },
    { pid: "perf-jeong-o-byeol-jeom", date: "2026-02-21", time: "19:00", day: "토" },
    { pid: "perf-jeong-o-byeol-jeom", date: "2026-02-22", time: "19:00", day: "일" },

    // 2. 29CM (Fri-Sun 19:00)
    { pid: "perf-29cm-stage", date: "2026-03-13", time: "19:00", day: "금" },
    { pid: "perf-29cm-stage", date: "2026-03-14", time: "19:00", day: "토" },
    { pid: "perf-29cm-stage", date: "2026-03-15", time: "19:00", day: "일" },

    // 3. Free Fall (Fri-Sun 19:00, modified from 18:00)
    { pid: "perf-free-fall", date: "2026-03-27", time: "19:00", day: "금" },
    { pid: "perf-free-fall", date: "2026-03-28", time: "19:00", day: "토" },
    { pid: "perf-free-fall", date: "2026-03-29", time: "19:00", day: "일" },

    // 4. ON:AIR (Fri-Sun 19:30, modified from 18:00)
    // Dates: 2/27 (Fri), 2/28 (Sat), 3/1 (Sun)
    { pid: "perf-on-air", date: "2026-02-27", time: "19:30", day: "금" },
    { pid: "perf-on-air", date: "2026-02-28", time: "19:30", day: "토" },
    { pid: "perf-on-air", date: "2026-03-01", time: "19:30", day: "일" }
];

async function uploadIndieBands() {
    console.log("🚀 Uploading Indie Bands Data...\n");

    // 1. Upload Performances
    const performances = JSON.parse(fs.readFileSync(PERFORMANCES_FILE, "utf8"));
    console.log(`Found ${performances.length} performances.`);

    for (const perf of performances) {
        console.log(`Uploading Performance: ${perf.title} (${perf.performanceId})`);

        // Ensure gradeMapping is present (it is in our JSON)
        await docClient.send(new PutCommand({
            TableName: PERF_TABLE,
            Item: {
                ...perf,
                createdAt: TODAY // Update createdAt to now
            }
        }));
    }
    console.log("✅ Performances Uploaded.\n");

    // 2. Upload Schedules
    console.log("🚀 Uploading Schedules...");
    for (const s of rawSchedules) {
        const scheduleId = `${s.pid}-${s.date}-${s.time}`;
        const datetime = `${s.date}T${s.time}`;

        console.log(`Uploading Schedule: ${scheduleId}`);

        await docClient.send(new PutCommand({
            TableName: SCHEDULE_TABLE,
            Item: {
                scheduleId,
                performanceId: s.pid,
                date: s.date,
                time: s.time,
                datetime,
                dayOfWeek: s.day,
                totalSeats: 1210, // Assuming same venue capacity for Charlotte Theater setup
                availableSeats: 1210,
                status: "AVAILABLE",
                casting: castings[s.pid],
                createdAt: TODAY
            }
        }));
    }
    console.log("✅ Schedules Uploaded.\n");
    console.log("🎉 All Indie Band Data Uploaded Successfully!");
}

uploadIndieBands().catch(error => {
    console.error("Error uploading data:", error);
    process.exit(1);
});
