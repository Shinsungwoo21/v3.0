export const BEDROCK_MODELS = {
    PRIMARY: {
        // Claude Haiku 4.5 - Cross-Region Inference (global prefix)
        // [V8.2] supportsPromptCaching: false - Cross-Region에서 prompt-caching이 ValidationException 유발 가능
        id: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
        supportsPromptCaching: false, // [V8.2] Cross-Region Inference 호환성 문제 해결
    },
    SECONDARY: {
        // Amazon Nova Lite - [V8.2] 프롬프트 캐싱 지원 활성화
        id: 'apac.amazon.nova-lite-v1:0',
        supportsPromptCaching: true,
    },
};

export const FALLBACK_CONFIG = {
    // Immediate Fallback (No Retry)
    // [V7.9] 400(Bad Request) Added for Invalid Model ID handling
    // [V7.10] Added 401, 403, 404 for Permission/Resource issues
    IMMEDIATE_FALLBACK_CODES: [400, 401, 403, 404, 429, 503],

    // Retry before Fallback
    RETRY_CODES: [500, 502, 504], // Internal Error, Bad Gateway, Timeout

    PRIMARY_TIMEOUT_MS: 10000,
    SECONDARY_TIMEOUT_MS: 15000,

    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 1000,
    RETRY_BACKOFF_MULTIPLIER: 1.5,
};
