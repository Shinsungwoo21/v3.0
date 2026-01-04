import { ToolConfiguration } from '@aws-sdk/client-bedrock-runtime';

// Import Modular Tool Handlers
import { getPerformanceSchedules } from './tools/get-performance-schedules';
import { getSeatGrades } from './tools/get-seat-grades';
import { holdSeats, cancelHold } from './tools/holding-tools';
import { getPerformances, getPerformanceDetails, getVenueInfo } from './tools/performance-tools';
import { getAvailableSeats } from './tools/seat-tools';
import { getMyReservations } from './tools/reservation-tools';

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
                            description: "사용자 ID"
                        }
                    },
                    required: ["userId"]
                },
                description: "반환되는 예약 상태(status) 중에 'DR_RECOVERED'가 있으면 '⚠️ 복구됨 - 결제 진행 필요' 상태임을 사용자에게 반드시 알려야 합니다."
            }
        }
    },
    {
        toolSpec: {
            name: "get_performances",
            description: "현재 예매 가능한 모든 공연 목록을 조회합니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {},
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_performance_details",
            description: "특정 공연의 상세 정보(날짜, 장소, 가격, 캐스팅 등)를 조회합니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        performanceId: {
                            type: "string",
                            description: "공연 ID"
                        }
                    },
                    required: ["performanceId"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_performance_schedules",
            description: `특정 공연의 예매 가능한 일정(회차)을 조회합니다.
  
            ⚠️ 중요: 이 도구는 반드시 schedules 테이블을 조회합니다.
            performances.dates나 performances.times를 사용하지 마세요!
            임의로 일정을 생성하거나 추측하지 마세요!
            
            반환 정보:
            - scheduleId: 회차 ID (예: perf-kinky-1-2026-02-10-19:30)
            - date: 날짜 (예: 2026-02-10)
            - time: 시간 (예: 19:30)
            - dayOfWeek: 요일 (예: 화, 토, 일)
            - availableSeats: 잔여 좌석 수 (예: 1240)
            - status: 상태 (AVAILABLE)
            
            사용 시점:
            - 사용자가 공연 일정을 물을 때
            - "주말에 보고 싶어", "2월 10일 있어?" 같은 질문
            - 좌석 예매 전 회차 선택이 필요할 때`,
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        performanceId: {
                            type: "string",
                            description: `공연 ID. 실제 값:
                            - 킹키부츠: "perf-kinky-1"
                            - 오페라의 유령: "perf-phantom-of-the-opera-1"`
                        },
                        fromDate: {
                            type: "string",
                            description: '조회 시작 날짜 (YYYY-MM-DD). 기본값: 오늘'
                        },
                        preferWeekend: {
                            type: "boolean",
                            description: '주말(토/일) 우선 필터링. 기본값: false'
                        },
                        limit: {
                            type: "number",
                            description: '반환할 일정 수. 기본값: 5'
                        }
                    },
                    required: ["performanceId"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_seat_grades",
            description: "해당 공연의 좌석 등급 및 가격 정보를 조회합니다. 회차 선택 후 좌석 등급을 안내할 때 사용합니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        performanceId: { type: "string" },
                        scheduleId: { type: "string" }
                    },
                    required: ["performanceId"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_available_seats",
            description: `[필수 호출] 좌석 정보를 답변하기 전에 반드시 이 도구를 호출해야 합니다.
            
            ⚠️ 주의사항:
            - 이 도구를 호출하지 않고 좌석 정보를 답변하면 안 됩니다.
            - "매진", "예매 가능", "잔여 좌석" 등을 언급하려면 반드시 먼저 호출하세요.
            - 도구 반환 결과의 availableCount가 0이 아니면 예매 가능합니다.
            
            반환 필드 설명:
            - availableCount: 총 예매 가능 좌석 수 (0이면 매진)
            - summary: 등급별 잔여석 요약
            - recommendedOptions: 추천 좌석 (인원수 맞춤)
            - errorCode: 에러 발생 시 코드 (예: MISSING_COUNT)
            `,
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        performanceId: { type: "string", description: "공연 ID" },
                        scheduleId: { type: "string", description: "회차 ID" },
                        grade: {
                            type: "string",
                            enum: ["VIP", "R", "S", "A", "OP"],
                            description: `좌석 등급. 반드시 사용자가 요청한 등급만 전달하세요.
- "VIP": VIP석 (OP석과 다름!)
- "R": R석
- "S": S석  
- "A": A석
- "OP": OP석 (최전방석, VIP와 다름!)

⚠️ 주의: 사용자가 "VIP"를 요청하면 반드시 "VIP"만 전달. "OP"를 전달하면 안 됩니다.`
                        },
                        count: { type: "number", description: "관람 인원 수 (최대 4매)" }
                    },
                    required: ["performanceId", "scheduleId", "count"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "get_venue_info",
            description: `공연장 상세 정보와 좌석 배치도를 조회합니다.
            
            추천 시나리오:
            - 좌석 배치도를 보여달라고 할 때
            - 공연장 정보를 물어볼 때
            
            ⚠️ 구역(Section) 정보는 performanceId를 입력해야 정확하게 조회됩니다.`,
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        venueId: {
                            type: "string",
                            description: "공연장 ID 또는 이름",
                        },
                        performanceId: {
                            type: "string",
                            description: "공연 ID (좌석 배치도 조회를 위해 권장)",
                        }
                    },
                    required: [], // Make both optional but encourage performanceId
                }
            }
        }
    },
    {
        toolSpec: {
            name: "hold_seats",
            description: "좌석을 선점(임시 예약)합니다. 이 도구를 호출하면 1분간 좌석이 홀딩됩니다. 결제 전 단계입니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        performanceId: { type: "string", description: "공연 ID" },
                        date: { type: "string", description: "공연 날짜" },
                        time: { type: "string", description: "공연 시간" },
                        seatIds: {
                            type: "array",
                            items: { type: "string" },
                            description: "선점할 좌석 ID 목록 (예: ['1층-B-7-14', '1층-B-7-15'])"
                        },
                        userId: { type: "string", description: "사용자 ID" }
                    },
                    required: ["performanceId", "date", "time", "seatIds", "userId"]
                }
            }
        }
    },
    {
        toolSpec: {
            name: "cancel_hold",
            description: "선점된 좌석(Holding)을 즉시 취소합니다.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        holdId: {
                            type: "string",
                            description: "해제할 선점 ID (Holding ID)"
                        }
                    },
                    required: ["holdId"]
                }
            }
        }
    }
    // [V8.4] Removed confirm_reservation and cancel_reservation
    // These actions are now handled by the Web Frontend.
];

// --- Tool Execution Logic ---

type ToolInput = any;

export async function executeTool(toolName: string, input: ToolInput): Promise<any> {
    console.log(`[ToolExec] ${toolName} called with:`, JSON.stringify(input));

    try {
        switch (toolName) {
            case "get_my_reservations": // Tool name in spec
            case "get_user_reservations": { // Allow alias
                return await getMyReservations(input);
            }

            case "get_performances": {
                return await getPerformances(input);
            }

            case "get_performance_details": {
                return await getPerformanceDetails(input);
            }

            case "get_performance_schedules": {
                // This logic was kept in its own file originally, so we just call it
                const { performanceId, fromDate, preferWeekend, limit } = input;
                try {
                    const result = await getPerformanceSchedules({
                        performanceId,
                        fromDate,
                        preferWeekend,
                        limit
                    });

                    // [V8.2] 디버그 로그 추가
                    console.log('[SCHEDULE_DEBUG] Query params:', { performanceId, fromDate, preferWeekend, limit });
                    console.log('[SCHEDULE_DEBUG] Result count:', result?.count || 0);

                    if (!result || result.count === 0) {
                        return { message: "조회된 공연 회차 정보가 없습니다." };
                    }
                    return {
                        success: true,
                        count: result.count,
                        hasMore: result.hasMore,
                        schedules: result.schedules,
                        message: `총 ${result.count}개의 공연 일정이 조회되었습니다.`
                    };
                } catch (e: any) {
                    console.error("Error in get_performance_schedules:", e);
                    return { error: "회차 정보를 불러오는 중 오류가 발생했습니다." };
                }
            }

            case "get_seat_grades": {
                console.log('[GRADE_DEBUG] Input:', input);
                const gradeResult = await getSeatGrades(input);
                return gradeResult;
            }

            case "get_venue_info": {
                return await getVenueInfo(input);
            }

            case "get_available_seats": {
                return await getAvailableSeats(input);
            }

            case "hold_seats": // V7.2 이름 변경
            case "create_holding": { // 호환성 유지
                return await holdSeats(input);
            }

            case "cancel_hold": // V7.2
            case "release_holding": {
                return await cancelHold(input);
            }

            default:
                return { error: `Unknown tool: ${toolName}` };
        }
    } catch (e: any) {
        return { error: e.message || "Internal Tool Error" };
    }
}
