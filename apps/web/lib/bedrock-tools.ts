
import {
    createHolding,
    confirmReservation,
    releaseHolding,
    getSeatStatusMap,
    getUserReservations,
    getHolding,
    Seat,
    Holding,
    Reservation
} from './server/holding-manager';
import { getPerformance, getSeatInfo } from './server/performance-service';
import { ToolConfiguration } from '@aws-sdk/client-bedrock-runtime';

// --- Tool Definitions (Schema) ---

export const BEDROCK_TOOLS: ToolConfiguration['tools'] = [
    {
        toolSpec: {
            name: "get_my_reservations",
            description: "현재 로그인한 사용자의 예약 내역을 조회합니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        userId: {
                            type: "string",
                            description: "사용자 ID (Context에서 자동 주입됨)"
                        }
                    },
                    required: ["userId"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_ticket_availability",
            description: "특정 공연의 잔여 좌석 현황을 조회합니다. 예약 가능한 좌석 정보를 반환합니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        performanceId: {
                            type: "string",
                            description: "공연 ID (예: perf-1)"
                        },
                        date: {
                            type: "string",
                            description: "공연 날짜 (YYYY-MM-DD)"
                        },
                        time: {
                            type: "string",
                            description: "공연 시간 (HH:mm)"
                        }
                    },
                    required: ["performanceId", "date", "time"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "create_holding",
            description: "선택한 좌석을 1분간 선점(Holding)합니다. 결제를 진행해야 예약이 확정됩니다. 중복된 좌석이 있으면 실패할 수 있습니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        performanceId: { type: "string", description: "공연 ID" },
                        date: { type: "string", description: "공연 날짜" },
                        time: { type: "string", description: "공연 시간" },
                        seats: {
                            type: "array",
                            items: { type: "string" },
                            description: "좌석 ID 배열 (예: ['A-5', 'A-6'])"
                        },
                        userId: { type: "string", description: "사용자 ID" }
                    },
                    required: ["performanceId", "date", "time", "seats", "userId"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "release_holding",
            description: "선점된 좌석(Holding)을 즉시 해제하여 취소합니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        holdingId: {
                            type: "string",
                            description: "해제할 선점 ID (Holding ID)"
                        }
                    },
                    required: ["holdingId"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "confirm_reservation",
            description: "선점된 좌석(Holding)을 확정하여 예약을 완료합니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        holdingId: {
                            type: "string",
                            description: "좌석 선점 ID (Holding ID)"
                        }
                    },
                    required: ["holdingId"]
                }
            }
        }
    }
];

// --- Tool Execution Logic ---

type ToolInput = any;

export async function executeTool(toolName: string, input: ToolInput): Promise<any> {
    console.log(`[ToolExec] ${toolName} called with:`, JSON.stringify(input));

    try {
        switch (toolName) {
            case "get_my_reservations": {
                const { userId } = input;
                const reservations = getUserReservations(userId);
                return {
                    count: reservations.length,
                    reservations: reservations.map(r => ({
                        id: r.id,
                        title: r.performanceTitle,
                        date: r.date,
                        time: r.time,
                        seats: r.seats.map(s => `${s.row}-${s.number}`).join(', '),
                        status: r.status
                    }))
                };
            }

            case "get_ticket_availability": {
                const { performanceId, date, time } = input;
                const statusMap = getSeatStatusMap(performanceId);

                // Initialize grades
                const grades: Record<string, string[]> = {
                    "VIP": [],
                    "R": [],
                    "S": [],
                    "A": []
                };

                // Filter available and group by grade
                Object.entries(statusMap)
                    .filter(([_, status]) => status === 'available')
                    .forEach(([id]) => {
                        const row = id.split('-')[0];
                        if (['A', 'B'].includes(row)) grades['VIP'].push(id);
                        else if (['C', 'D', 'E'].includes(row)) grades['R'].push(id);
                        else if (['F', 'G', 'H'].includes(row)) grades['S'].push(id);
                        else if (['I', 'J'].includes(row)) grades['A'].push(id);
                    });

                // Summary string for Bot
                const summary = Object.entries(grades)
                    .map(([grade, seats]) => `${grade}석(${seats.length}석)`)
                    .join(', ');

                return {
                    totalAvailable: Object.values(grades).reduce((acc, curr) => acc + curr.length, 0),
                    summary,
                    details: grades, // structured data for advanced logic
                    message: `현재 잔여석 현황입니다: ${summary}. \n(참고: VIP석은 A-B열, R석은 C-E열, S석은 F-H열, A석은 I-J열입니다. 예: R석 선택 시 C-1, D-5 등). 원하시는 등급을 말씀해 주시면 좋은 좌석을 추천해 드립니다.`
                };
            }

            case "create_holding": {
                const { performanceId, date, time, seats, userId } = input;

                // Need to map seat IDs to Seat objects provided structure
                // For this mock, we assume simple conversion or need to look up seat details.
                // createHolding expects Seat objects.
                // We'll create minimal Seat objects for the mock since holding manager mainly checks ID.
                const seatObjects: Seat[] = seats.map((id: string) => {
                    const [row, numStr] = id.split('-');
                    const { grade, price } = getSeatInfo(id);
                    return {
                        seatId: id,
                        row: row,
                        number: parseInt(numStr),
                        grade: grade,
                        price: price
                    };
                });

                const result = createHolding(performanceId, seatObjects, userId, date, time);

                if (!result.success) {
                    return {
                        success: false,
                        error: result.error,
                        unavailableSeats: result.unavailableSeats
                    };
                }

                return {
                    success: true,
                    holdingId: result.holdingId,
                    expiresAt: result.expiresAt,
                    message: `선택하신 좌석이 고객님께 선점되었습니다. 1분 이내 결제하지 않으실 경우 선점된 좌석이 해제됩니다.
<!-- ACTION_DATA: ${JSON.stringify({
                        type: "HOLDING_CREATED",
                        holdingId: result.holdingId,
                        expiresAt: result.expiresAt
                    })} -->`
                };
            }

            case "release_holding": {
                const { holdingId } = input;
                const result = releaseHolding(holdingId);
                if (result) {
                    return {
                        success: true,
                        holdingId: holdingId,
                        message: "좌석 선점이 정상적으로 해제되었습니다."
                    };
                } else {
                    return {
                        success: false,
                        holdingId: holdingId,
                        message: "선점 ID를 찾을 수 없거나 이미 해제되었습니다."
                    };
                }
            }

            case "confirm_reservation": {
                const { holdingId } = input;
                const holding = getHolding(holdingId);
                if (!holding) {
                    return { success: false, error: "선점 정보를 찾을 수 없습니다." };
                }

                const perf = getPerformance(holding.performanceId);
                const title = perf ? perf.title : "알 수 없는 공연";
                const venue = perf ? perf.venue : "알 수 없는 공연장";

                const result = confirmReservation(
                    holdingId,
                    title,
                    venue
                );

                if (!result.success) {
                    return { success: false, error: result.error };
                }

                return {
                    success: true,
                    reservationId: result.reservation?.id,
                    message: "예약이 확정되었습니다."
                };
            }

            default:
                return { error: `Unknown tool: ${toolName}` };
        }
    } catch (e: any) {
        console.error(`[ToolExec Error] ${toolName}:`, e);
        return { error: e.message || "Internal Tool Error" };
    }
}
