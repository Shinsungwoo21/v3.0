import { NextRequest, NextResponse } from "next/server"
import { getUserReservations, cancelReservation } from "@/lib/server/holding-manager"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            )
        }

        const userReservations = getUserReservations(userId)

        return NextResponse.json(userReservations)
    } catch (error) {
        console.error("Failed to fetch reservations:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const reservationId = searchParams.get("reservationId")

        if (!reservationId) {
            return NextResponse.json(
                { error: "Reservation ID is required" },
                { status: 400 }
            )
        }

        const success = cancelReservation(reservationId)

        if (!success) {
            return NextResponse.json(
                { error: "Reservation not found or already cancelled" },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to cancel reservation:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
