// apps/app/lib/prompts/conversation-state.ts
// 세션별 대화 상태 관리 (In-memory, 5분 TTL)
// [V8.2] 기존 유지

export type ConversationStep =
    | 'GREETING'
    | 'STEP_1'
    | 'STEP_2'
    | 'STEP_3'
    | 'STEP_4'
    | 'STEP_5'
    | 'STEP_6'
    | 'STEP_7'
    | 'STEP_8'
    | 'STEP_9'
    | 'INFO_MODE';

export interface ConversationContext {
    performanceId?: string;
    performanceName?: string;
    scheduleId?: string;
    date?: string;
    time?: string;
    grade?: string;
    headcount?: number;
    selectedSeats?: {
        section: string;
        row: string;
        seatNumbers: number[];
    };
    holdingId?: string;
    reservationId?: string;
    totalPrice?: number;
}

export interface ConversationState {
    sessionId: string;
    currentStep: ConversationStep;
    context: ConversationContext;
    lastUpdated: number;
}

// In-memory 저장소
const stateStore = new Map<string, ConversationState>();

// TTL: 5분 (밀리초)
const STATE_TTL = 5 * 60 * 1000;

// 만료된 세션 자동 정리 (메모리 누수 방지) - 1분마다 실행
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, state] of stateStore) {
        if (now - state.lastUpdated > STATE_TTL) {
            stateStore.delete(sessionId);
            console.log(`[State] Session expired and cleaned: ${sessionId}`);
        }
    }
}, 60 * 1000);

/**
 * 세션 상태 조회
 */
export function getState(sessionId: string): ConversationState {
    const state = stateStore.get(sessionId);

    // 상태 없거나 만료된 경우 초기화
    if (!state || Date.now() - state.lastUpdated > STATE_TTL) {
        const initialState: ConversationState = {
            sessionId,
            currentStep: 'GREETING',
            context: {},
            lastUpdated: Date.now(),
        };
        stateStore.set(sessionId, initialState);
        return initialState;
    }

    return state;
}

/**
 * 세션 상태 업데이트
 */
export function updateState(
    sessionId: string,
    step: ConversationStep,
    contextUpdate: Partial<ConversationContext>
): ConversationState {
    const currentState = getState(sessionId);

    const newState: ConversationState = {
        ...currentState,
        currentStep: step,
        context: {
            ...currentState.context,
            ...contextUpdate,
        },
        lastUpdated: Date.now(),
    };

    stateStore.set(sessionId, newState);
    return newState;
}

/**
 * 세션 상태 초기화
 */
export function resetState(sessionId: string): void {
    stateStore.delete(sessionId);
}

/**
 * 컨텍스트 유효성 검증 (단계별 필수 컨텍스트 확인)
 */
export function validateContext(
    step: ConversationStep,
    context: ConversationContext
): boolean {
    const REQUIRED_CONTEXT_BY_STEP: Record<string, string[]> = {
        'STEP_2': ['performanceId', 'performanceName'],
        'STEP_3': ['performanceId', 'scheduleId', 'date', 'time'],
        'STEP_4': ['performanceId', 'scheduleId', 'headcount'],
        'STEP_5': ['performanceId', 'scheduleId', 'headcount', 'grade'],
        'STEP_6': ['performanceId', 'scheduleId', 'headcount', 'grade', 'selectedSeats'],
        'STEP_7': ['holdingId', 'selectedSeats', 'totalPrice'],
        'STEP_8': ['holdingId'],
    };

    const required = REQUIRED_CONTEXT_BY_STEP[step] || [];
    return required.every(key => (context as Record<string, unknown>)[key] !== undefined);
}

/**
 * 도구 결과 및 사용자 입력 기반 다음 단계 결정
 */
export function determineNextStep(
    currentStep: ConversationStep,
    userMessage: string,
    toolResults?: Record<string, unknown>,
    context?: ConversationContext
): ConversationStep {
    const msg = userMessage.toLowerCase();

    // 컨텍스트 유효성 검증 실패 시 복구
    if (context && !validateContext(currentStep, context)) {
        console.warn(`[State] Invalid context for ${currentStep}, resetting...`);
        return 'GREETING';
    }

    // 도구 결과 기반 전환 (키워드보다 우선)
    if (toolResults) {
        // hold_seats 실패 시 STEP_5로 복귀
        if (toolResults.error && currentStep === 'STEP_7') {
            return 'STEP_5';
        }
        // confirm_reservation 성공 시 대화 종료
        if (toolResults.reservationId && currentStep === 'STEP_8') {
            return 'GREETING';
        }
    }

    // 공통 전환 규칙
    if (msg.includes('취소') || msg.includes('예약 취소')) {
        return 'STEP_9';
    }
    if (msg.includes('내 예약') || msg.includes('예약 확인') || msg.includes('예약 조회')) {
        return 'STEP_9';
    }

    // 단계별 전환 규칙
    switch (currentStep) {
        case 'GREETING':
            if (msg.includes('공연') || msg.includes('보여줘') || msg.includes('뭐 볼')) {
                return 'STEP_1';
            }
            // 공연명 직접 언급 시
            if (toolResults?.performanceId) {
                return 'STEP_1';
            }
            return 'GREETING';

        case 'STEP_1':
            // 정보 모드 키워드 (step-1-performance.ts와 동기화)
            if (msg.includes('가격') || msg.includes('얼마') || msg.includes('캐스팅') ||
                msg.includes('출연') || msg.includes('누가') ||
                msg.includes('언제까지') || msg.includes('배우')) {
                return 'INFO_MODE';
            }
            // 예매 의도
            if (msg.includes('예매') || msg.includes('예약') || toolResults?.scheduleId) {
                return 'STEP_2';
            }
            return 'STEP_1';

        case 'STEP_2':
            // 날짜/시간 선택 완료
            if (toolResults?.scheduleId || msg.match(/\d+월\s*\d+일/) ||
                msg.includes('마티네') || msg.includes('소야')) {
                return 'STEP_3';
            }
            return 'STEP_2';

        case 'STEP_3':
            // 인원 확인 완료
            if (msg.match(/\d+\s*명/) || msg.match(/\d+\s*분/)) {
                return 'STEP_4';
            }
            return 'STEP_3';

        case 'STEP_4':
            // 등급 선택 완료
            if (msg.includes('op') || msg.includes('vip') ||
                msg.includes('r석') || msg.includes('s석') || msg.includes('a석')) {
                return 'STEP_5';
            }
            return 'STEP_4';

        case 'STEP_5':
            // 좌석 선택 완료
            if (msg.match(/[1-3]번/) || msg.includes('첫 번째') ||
                msg.includes('두 번째') || msg.includes('세 번째')) {
                return 'STEP_6';
            }
            if (msg.includes('다른 등급')) {
                return 'STEP_4';
            }
            return 'STEP_5';

        case 'STEP_6':
            // 선점 확인 - 긍정 응답 인식 (구어체 포함)
            if (msg.includes('네') || msg.includes('응') || msg.includes('웅') ||
                msg.includes('좋아') || msg.includes('선점') || msg.includes('예') ||
                msg.includes('그래') || msg.includes('진행') || msg.includes('확인') ||
                msg.includes('할게') || msg.includes('해줘') || msg.includes('부탁') ||
                msg === 'ㅇㅇ' || msg === 'ㅇ' || msg === 'ok' || msg === 'okay') {
                return 'STEP_7';
            }
            if (msg.includes('다른 좌석')) {
                return 'STEP_5';
            }
            return 'STEP_6';

        case 'STEP_7':
            // 선점 완료 후
            if (msg.includes('확정') || msg.includes('예약')) {
                return 'STEP_8';
            }
            if (msg.includes('취소')) {
                return 'STEP_1';
            }
            return 'STEP_7';

        case 'STEP_8':
            // 예약 완료 후
            if (msg.includes('취소')) {
                return 'STEP_9';
            }
            return 'GREETING';

        case 'STEP_9':
            return 'GREETING';

        case 'INFO_MODE':
            if (msg.includes('예매') || msg.includes('예약')) {
                return 'STEP_2';
            }
            return 'INFO_MODE';

        default:
            return 'GREETING';
    }
}

/**
 * 도구 결과에서 컨텍스트 추출
 */
export function extractContextFromToolResults(
    toolName: string,
    toolResult: Record<string, unknown>
): Partial<ConversationContext> {
    switch (toolName) {
        case 'get_performances':
            return {};

        case 'get_performance':
            return {
                performanceId: toolResult.performanceId as string,
                performanceName: toolResult.title as string,
            };

        case 'get_schedules':
            return {};

        case 'get_seat_grades':
            return {};

        case 'get_available_seats':
            return {};

        case 'hold_seats':
            return {
                holdingId: toolResult.holdingId as string,
                selectedSeats: toolResult.seats as ConversationContext['selectedSeats'],
                totalPrice: toolResult.totalPrice as number,
            };

        case 'confirm_reservation':
            return {
                reservationId: toolResult.reservationId as string,
            };

        default:
            return {};
    }
}

/**
 * 사용자 메시지에서 컨텍스트 추출
 */
export function extractContextFromMessage(
    currentStep: ConversationStep,
    message: string
): Partial<ConversationContext> {
    const context: Partial<ConversationContext> = {};

    // 인원 추출
    const countMatch = message.match(/(\d+)\s*(명|분)/);
    if (countMatch) {
        context.headcount = parseInt(countMatch[1]);
    }

    // 등급 추출
    const gradeMap: Record<string, string> = {
        'op': 'OP',
        'vip': 'VIP',
        'r석': 'R',
        's석': 'S',
        'a석': 'A',
    };
    for (const [key, value] of Object.entries(gradeMap)) {
        if (message.toLowerCase().includes(key)) {
            context.grade = value;
            break;
        }
    }

    return context;
}
