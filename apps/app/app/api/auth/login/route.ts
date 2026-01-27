import { NextResponse } from "next/server";
import { validateUser } from "@/lib/user-service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
        }

        const result = await validateUser(email, password);

        if (!result) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // 쿠키 설정 등은 클라이언트 처리 또는 여기서 Set-Cookie 헤더
        // 여기서는 간단히 토큰 반환
        return NextResponse.json({
            success: true,
            token: result.token,
            user: { email: result.user.email, name: result.user.name }
        });

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
