import { NextResponse } from "next/server";
import { createUser } from "@/lib/user-service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await createUser({ email, password, name });

        return NextResponse.json({ success: true, user });

    } catch (error: any) {
        console.error("Signup error:", error);
        if (error.message === "User already exists") {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
