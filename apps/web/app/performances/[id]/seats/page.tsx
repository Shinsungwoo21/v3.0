"use client"

import { SeatMap } from "@/components/seats/seat-map"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { reservationStore } from "@/lib/reservation-store"
import { Seat } from "@/types/venue"
import { useState, useEffect } from "react"
import { PERFORMANCES } from "@/lib/performance-data"

export default function SeatsPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const performanceId = params.id as string

    // Get Performance Data to determine valid default date/time
    const performanceKey = performanceId.startsWith("perf-kinky") ? "perf-kinky-1" : "perf-1"
    const performance = PERFORMANCES[performanceKey]

    // Default to the first available schedule if no date provided
    const defaultDate = performance?.schedules[0]?.date || "2025-12-25"
    const defaultTime = performance?.schedules[0]?.times[0]?.time || "19:00"

    const date = searchParams.get("date") || defaultDate
    const time = searchParams.get("time") || defaultTime

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null) // State for alert message

    // Clear error message after 3 seconds
    const [showError, setShowError] = useState(false)
    useEffect(() => {
        if (showError) {
            const timer = setTimeout(() => {
                setShowError(false)
                setErrorMsg(null)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [showError])

    const handleSelectionComplete = async (selectedSeats: Seat[], totalPrice: number) => {
        if (isSubmitting) return
        setIsSubmitting(true)

        try {
            // 1. Create Holding (Server Side Check)
            const res = await fetch("/api/holdings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    performanceId,
                    seats: selectedSeats,
                    userId: "guest-user-1", // Mock User ID for now, assume from Context in real app
                    date,
                    time
                })
            })

            const data = await res.json()

            if (!res.ok) {
                // Show Error Overlay instead of alert
                setErrorMsg(data.message || "이미 선택된 좌석입니다.")
                setShowError(true)
                // START DEBUG: Fallback alert to confirm logic path
                // alert(data.message || "이미 선택된 좌석입니다 (DEBUG ALERT)")
                // END DEBUG
                setIsSubmitting(false)

                // Refresh logic if needed, but user can click refresh button manually
                return
            }

            // 2. Save session for local display logic (optional, but keep for consistency)
            reservationStore.saveSession({
                performanceId,
                performanceTitle: "오페라의 유령 (The Phantom of the Opera)",
                date,
                time,
                seats: selectedSeats,
                totalPrice,
                // Add holding info if needed, but ConfirmPage will use URL param mostly
            })

            // 3. Redirect to Confirm Page with Holding ID and Expiration Time
            const expiresAtParam = data.expiresAt ? `&expiresAt=${encodeURIComponent(data.expiresAt)}` : ''
            router.push(`/reservation/confirm?holdingId=${data.holdingId}${expiresAtParam}`)

        } catch (e) {
            console.error(e)
            setErrorMsg("시스템 오류가 발생했습니다.")
            setShowError(true)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col relative">
            {/* Error Alert Overlay */}
            {showError && errorMsg && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] animate-in fade-in zoom-in duration-300 pointer-events-none">
                    <div className="bg-red-400/90 text-white px-8 py-4 rounded-full shadow-2xl backdrop-blur-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="font-bold text-lg">{errorMsg}</span>
                    </div>
                </div>
            )}

            <SeatMap
                venueId="sample-theater" // hardcoded for now
                performanceId={performanceId}
                date={date}
                time={time}
                onSelectionComplete={handleSelectionComplete}
            />
        </div>
    )
}
