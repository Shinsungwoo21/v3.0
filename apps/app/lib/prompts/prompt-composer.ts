// apps/app/lib/prompts/prompt-composer.ts
// 단계별 프롬프트 동적 조립
// [V8.2] 버전 표시 업데이트

import { BASE_PROMPT } from './base-prompt';
import { STEP_GREETING_PROMPT } from './step-greeting';
import { STEP_1_PROMPT } from './step-1-performance';
import { STEP_2_PROMPT } from './step-2-schedule';
import { STEP_3_PROMPT } from './step-3-headcount';
import { STEP_4_PROMPT } from './step-4-grade';
import { STEP_5_PROMPT } from './step-5-seats';
import { STEP_6_PROMPT } from './step-6-confirm';
import { STEP_7_PROMPT } from './step-7-holding';
import { STEP_8_PROMPT } from './step-8-reservation';
import { STEP_9_PROMPT } from './step-9-cancel';
import { STEP_INFO_MODE_PROMPT } from './step-info-mode';
import { ConversationStep, ConversationContext } from './conversation-state';

// 환경변수 처리
const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-2';

const STEP_PROMPTS: Record<ConversationStep, string> = {
    'GREETING': STEP_GREETING_PROMPT,
    'STEP_1': STEP_1_PROMPT,
    'STEP_2': STEP_2_PROMPT,
    'STEP_3': STEP_3_PROMPT,
    'STEP_4': STEP_4_PROMPT,
    'STEP_5': STEP_5_PROMPT,
    'STEP_6': STEP_6_PROMPT,
    'STEP_7': STEP_7_PROMPT,
    'STEP_8': STEP_8_PROMPT,
    'STEP_9': STEP_9_PROMPT,
    'INFO_MODE': STEP_INFO_MODE_PROMPT,
};

/**
 * 컨텍스트 요약 생성
 */
function generateContextSummary(context: ConversationContext): string {
    const lines: string[] = [];

    lines.push(`- 현재 리전: ${region}`);

    if (context.performanceName) {
        lines.push(`- 공연: ${context.performanceName} (ID: ${context.performanceId})`);
    }
    if (context.date) {
        lines.push(`- 날짜: ${context.date} ${context.time || ''}`);
    }
    if (context.scheduleId) {
        lines.push(`- 스케줄 ID: ${context.scheduleId}`);
    }
    if (context.headcount) {
        lines.push(`- 인원: ${context.headcount}명`);
    }
    if (context.grade) {
        lines.push(`- 좌석 등급: ${context.grade}석`);
    }
    if (context.selectedSeats) {
        const seats = context.selectedSeats;
        const seatNumbers = seats.seatNumbers.join(', ');
        lines.push(`- 선택 좌석: ${seats.section} ${seats.row} ${seatNumbers}번`);
    }
    if (context.holdingId) {
        lines.push(`- 선점 ID: ${context.holdingId}`);
    }
    if (context.totalPrice) {
        lines.push(`- 총 금액: ${context.totalPrice.toLocaleString()}원`);
    }

    return lines.length > 1 ? lines.join('\n') : '- 없음 (첫 대화)';
}

/**
 * 시스템 프롬프트 조립
 * [V8.2] Anti-Hallucination 버전
 */
export function composeSystemPrompt(
    currentStep: ConversationStep,
    context: ConversationContext
): string {
    let stepPrompt = STEP_PROMPTS[currentStep] || STEP_PROMPTS['GREETING'];

    // [V8.3] Prompt Template Variable Substitution
    stepPrompt = stepPrompt.replace(/\{AWS_REGION\}/g, region);
    if (context.performanceId) stepPrompt = stepPrompt.replace(/\{performanceId\}/g, context.performanceId);
    if (context.date) stepPrompt = stepPrompt.replace(/\{date\}/g, context.date);
    if (context.time) stepPrompt = stepPrompt.replace(/\{time\}/g, context.time);
    const contextSummary = generateContextSummary(context);

    return `
${BASE_PROMPT}

== 현재 예매 컨텍스트 ==
${contextSummary}

== 현재 단계 규칙 ==
${stepPrompt}
`.trim();
}

/**
 * 토큰 수 추정 (한글/영어 혼합 고려)
 */
export function estimateTokenCount(text: string): number {
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const englishChars = text.length - koreanChars;

    // 한글: ~2자당 1토큰, 영어: ~4자당 1토큰
    return Math.ceil(koreanChars / 2) + Math.ceil(englishChars / 4);
}

export default composeSystemPrompt;
