// apps/app/lib/prompts/index.ts
// 모든 프롬프트 및 함수 export
// [V8.2] Anti-Hallucination 버전

// Step Prompts
export { BASE_PROMPT } from './base-prompt';
export { STEP_GREETING_PROMPT } from './step-greeting';
export { STEP_1_PROMPT } from './step-1-performance';
export { STEP_2_PROMPT } from './step-2-schedule';
export { STEP_3_PROMPT } from './step-3-headcount';
export { STEP_4_PROMPT } from './step-4-grade';
export { STEP_5_PROMPT } from './step-5-seats';
export { STEP_6_PROMPT } from './step-6-confirm';
export { STEP_7_PROMPT } from './step-7-holding';
export { STEP_8_PROMPT } from './step-8-reservation';
export { STEP_9_PROMPT } from './step-9-cancel';
export { STEP_INFO_MODE_PROMPT } from './step-info-mode';

// Prompt Composer
export { composeSystemPrompt, estimateTokenCount } from './prompt-composer';

// Conversation State - Types
export type {
    ConversationStep,
    ConversationContext,
    ConversationState,
} from './conversation-state';

// Conversation State - Functions
export {
    getState,
    updateState,
    resetState,
    validateContext,
    determineNextStep,
    extractContextFromToolResults,
    extractContextFromMessage,
} from './conversation-state';
