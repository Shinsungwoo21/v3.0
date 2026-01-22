
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: "ap-northeast-2" });

async function check() {
    try {
        const command = new GetItemCommand({
            TableName: "plcr-gtbl-performances",
            Key: {
                performanceId: { S: "perf-free-fall" }
            }
        });
        const response = await client.send(command);
        if (response.Item) {
            console.log("Current Title in DB:", response.Item.title.S);
        } else {
            console.log("Item not found");
        }
    } catch (e) {
        console.error(e);
    }
}

check();
