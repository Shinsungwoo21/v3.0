import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS 미들웨어 - S3 정적 호스팅에서 Cross-Origin 요청 허용
 * CloudFront에서 /api/* 요청이 이 App 서버로 라우팅됨
 */

const allowedOrigins = [
    'https://megaticket.click',
    'https://www.megaticket.click',
    'http://localhost:3000',
    'http://localhost:3001',
];

// CloudFront 도메인 패턴
const cloudFrontPattern = /\.cloudfront\.net$/;

function isAllowedOrigin(origin: string): boolean {
    return allowedOrigins.includes(origin) || cloudFrontPattern.test(origin);
}

export function middleware(request: NextRequest) {
    const origin = request.headers.get('origin') || '';
    const isAllowed = isAllowedOrigin(origin);

    // Preflight 요청 (OPTIONS)
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': isAllowed ? origin : '',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-origin-verify',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
                'Access-Control-Expose-Headers': 'X-Api-Region',
                'X-Api-Region': process.env.AWS_REGION || 'ap-northeast-2',
            },
        });
    }

    // 일반 요청
    const response = NextResponse.next();

    // 모든 응답에 X-Api-Region 헤더 추가 (DR 전환 시 클라이언트가 리전 감지 가능)
    response.headers.set('X-Api-Region', process.env.AWS_REGION || 'ap-northeast-2');
    response.headers.set('Access-Control-Expose-Headers', 'X-Api-Region');

    if (isAllowed) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
}

// /api/* 경로에만 미들웨어 적용
export const config = {
    matcher: '/api/:path*',
};
