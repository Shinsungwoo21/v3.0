import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "KDT-Msp4-PLDR-venues";
const VENUE_ID = "charlotte-theater";

const sectionConfig = {
    '1층': {
        'A': { min: 1, max: 12, centerType: 'high' },
        'B': {
            min: 13, max: 26,
            centerType: 'middle',
            idealCenter: 19.5,
            idealRange: { start: 18, end: 21 },
            // V8.21: Added specialRows to capture OP logic
            specialRows: {
                'OP': {
                    min: 1,
                    max: 12,
                    centerType: 'middle',
                    idealCenter: 6.5,
                    idealRange: { start: 5, end: 8 }
                }
            }
        },
        'C': { min: 27, max: 38, centerType: 'low' },
    },
    '2층': {
        'D': { min: 1, max: 13, centerType: 'high' },
        'E': {
            min: 14, max: 26,
            centerType: 'middle',
            idealCenter: 20,
            idealRange: { start: 18, end: 21 }
        },
        'F': { min: 27, max: 39, centerType: 'low' }
    }
};

async function run() {
    try {
        console.log(`Updating venue ${VENUE_ID} in ${TABLE_NAME}...`);
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { venueId: VENUE_ID },
            UpdateExpression: "set sectionConfig = :sc",
            ExpressionAttributeValues: {
                ":sc": sectionConfig
            },
            ReturnValues: "UPDATED_NEW"
        });

        const result = await docClient.send(command);
        console.log("Update success!", JSON.stringify(result.Attributes, null, 2));
    } catch (err) {
        console.error("Error updating venue:", err);
    }
}

run();
