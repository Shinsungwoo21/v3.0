import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-2" });
const docClient = DynamoDBDocumentClient.from(client);

// 기존 프로젝트의 방식을 따라 Fallback을 포함한 환경변수 사용 (하드코딩 방지)
const TABLE_NAME = process.env.DYNAMODB_TABLE_USERS || "plcr-gtbl-users";

export async function createUser(data: any) {
    const { email, password, name } = data;

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
        email,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // ⭐ 핵심 수정: ConditionExpression 추가로 Race Condition 해결
    try {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: user,
            ConditionExpression: "attribute_not_exists(email)",
        }));
    } catch (error: any) {
        // ConditionalCheckFailedException = 이미 존재하는 이메일
        if (error.name === "ConditionalCheckFailedException") {
            throw new Error("User already exists");
        }
        // 기타 에러
        console.error("Error creating user:", error);
        throw error;
    }

    return { email, name };
}

export async function getUserByEmail(email: string) {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
            email, // PK matches schema
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

    const token = jwt.sign({ email: user.email, name: user.name }, process.env.JWT_SECRET || "secret-key", { expiresIn: "1h" });

    return { user, token };
}
