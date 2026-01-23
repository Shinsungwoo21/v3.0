import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "plcr-gtbl-users"; // v2: Corrected table name based on infra scan

export async function createUser(data: any) {
    const { email, password, name } = data;

    // 1. 중복 확인
    const existing = await getUserByEmail(email);
    if (existing) {
        throw new Error("User already exists");
    }

    // 2. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 저장
    const user = {
        pk: `USER#${email}`,
        sk: `PROFILE`,
        email,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: user
    }));

    return { email, name };
}

export async function getUserByEmail(email: string) {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
            pk: `USER#${email}`,
            sk: `PROFILE`,
        },
    });

    const response = await docClient.send(command);
    return response.Item;
}

export async function validateUser(email: string, password: string) {
    const user = await getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    // JWT 토큰 생성 등을 여기서 하거나 호출부에서 함
    const token = jwt.sign({ email: user.email, name: user.name }, process.env.JWT_SECRET || "secret-key", { expiresIn: "1h" });

    return { user, token };
}
