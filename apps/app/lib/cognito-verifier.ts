/**
 * Cognito JWT Token Verifier
 * 
 * Backend에서 Cognito Access Token 검증용
 * 
 * 설치: npm install aws-jwt-verify
 * 
 * 사용법:
 * import { verifyToken } from './lib/cognito-verifier';
 * const result = await verifyToken(accessToken);
 * if (result.valid) { ... }
 */

import { CognitoJwtVerifier } from "aws-jwt-verify";

// 환경 변수에서 Cognito 설정 로드
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || "";

// Cognito JWT 검증기 생성
export const cognitoVerifier = CognitoJwtVerifier.create({
    userPoolId: USER_POOL_ID,
    clientId: CLIENT_ID,
    tokenUse: "access", // "access" 또는 "id"
});

// Token Payload 타입
export interface TokenPayload {
    sub: string;
    email?: string;
    "cognito:username"?: string;
    exp: number;
    iat: number;
    token_use: string;
    scope?: string;
    [key: string]: unknown;
}

// 검증 결과 타입
export interface VerifyResult {
    valid: boolean;
    payload?: TokenPayload;
    error?: string;
}

/**
 * Access Token 검증 함수
 * @param token - Cognito Access Token (Bearer 제외)
 * @returns 검증 결과 (valid, payload, error)
 */
export async function verifyToken(token: string): Promise<VerifyResult> {
    try {
        // Bearer 접두사 제거
        const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

        // JWT 검증
        const payload = await cognitoVerifier.verify(cleanToken) as TokenPayload;

        return {
            valid: true,
            payload,
        };
    } catch (error) {
        console.error("Token verification failed:", error);

        return {
            valid: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 사용자 정보 추출 함수
 * @param token - Cognito Access Token
 * @returns 사용자 ID (sub) 또는 null
 */
export async function getUserFromToken(token: string): Promise<string | null> {
    const result = await verifyToken(token);

    if (result.valid && result.payload) {
        return result.payload.sub;
    }

    return null;
}

/**
 * Express/Next.js 미들웨어용 검증 함수
 * 
 * 사용 예시 (Next.js API Route):
 * export async function GET(request: Request) {
 *   const authHeader = request.headers.get("Authorization");
 *   const authResult = await authenticateRequest(authHeader);
 *   if (!authResult.valid) {
 *     return Response.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 *   // authResult.userId 사용
 * }
 */
export async function authenticateRequest(
    authHeader: string | null
): Promise<{ valid: boolean; userId?: string; error?: string }> {
    if (!authHeader) {
        return { valid: false, error: "Authorization header missing" };
    }

    if (!authHeader.startsWith("Bearer ")) {
        return { valid: false, error: "Invalid authorization format" };
    }

    const result = await verifyToken(authHeader);

    if (result.valid && result.payload) {
        return {
            valid: true,
            userId: result.payload.sub,
        };
    }

    return {
        valid: false,
        error: result.error || "Token verification failed",
    };
}
