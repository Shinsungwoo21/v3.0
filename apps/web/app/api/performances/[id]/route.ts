import { NextRequest, NextResponse } from "next/server";
import { getPerformance } from "@/lib/server/performance-service";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const performance = await getPerformance(id);

    if (!performance) {
        return NextResponse.json(
            { error: "Performance not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(performance);
}
