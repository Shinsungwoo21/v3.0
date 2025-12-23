
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";
import * as path from "path";
import { PERFORMANCES } from "../lib/performance-data";

// V5 Table Names
const TABLE_PERFORMANCES = "KDT-Msp4-PLDR-performances";
const TABLE_VENUES = "KDT-Msp4-PLDR-venues";

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
});

async function migrate() {
    console.log("🚀 Starting V5 Data Migration...");

    // 1. Migrate Venues
    console.log(`\n📦 Migrating Venues to ${TABLE_VENUES}...`);
    try {
        const venuePath = path.join(process.cwd(), "data/venues/sample-theater.json");
        const venueData = JSON.parse(fs.readFileSync(venuePath, "utf-8"));

        // Ensure venueId matches what we expect
        if (!venueData.venueId) venueData.venueId = "charlotte-theater";
        venueData.createdAt = new Date().toISOString();

        await docClient.send(new PutCommand({
            TableName: TABLE_VENUES,
            Item: venueData
        }));
        console.log(`✅ Venue '${venueData.venueId}' migrated.`);
    } catch (e) {
        console.error("❌ Failed to migrate venue:", e);
    }

    // 2. Migrate Performances
    console.log(`\n📦 Migrating Performances to ${TABLE_PERFORMANCES}...`);
    try {
        for (const [key, perf] of Object.entries(PERFORMANCES)) {
            // Add venueId ref
            const item = {
                ...perf,
                performanceId: perf.id, // Ensure PK is present
                venueId: "charlotte-theater", // Link to venue
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Remove id if it duplicates PK, but keeping it is fine too.
            // DynamoDB allows it. 

            await docClient.send(new PutCommand({
                TableName: TABLE_PERFORMANCES,
                Item: item
            }));
            console.log(`✅ Performance '${perf.title}' (${perf.id}) migrated.`);
        }
    } catch (e) {
        console.error("❌ Failed to migrate performances:", e);
    }

    console.log("\n🎉 V5 Migration Complete!");
}

migrate();
