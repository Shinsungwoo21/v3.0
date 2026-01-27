/**
 * 런타임 Config 시스템
 * S3 정적 호스팅을 위해 환경변수 대신 런타임에 config.js에서 설정을 로드
 */

interface PlcrRuntimeConfig {
    API_URL: string;
    AWS_REGION: string;
    PROJECT: string;
    ENVIRONMENT: string;
    AUTH_ENABLED: boolean;
    AUTH_PROVIDER: string;
    COGNITO_USER_POOL_ID?: string;
    COGNITO_CLIENT_ID?: string;
    COGNITO_DOMAIN?: string;
}

declare global {
    interface Window {
        __PLCR_CONFIG__?: PlcrRuntimeConfig;
    }
}

const DEFAULT_CONFIG: PlcrRuntimeConfig = {
    API_URL: "https://api.megaticket.click",
    AWS_REGION: "ap-northeast-2",
    PROJECT: "plcr",
    ENVIRONMENT: "prod",
    AUTH_ENABLED: true,
    AUTH_PROVIDER: "cognito", // "cognito" 또는 "mock"
    // Cognito 기본값 (config.js에서 덮어씀)
    COGNITO_USER_POOL_ID: "",
    COGNITO_CLIENT_ID: "",
    COGNITO_DOMAIN: "",
};

export function getPlcrConfig(): PlcrRuntimeConfig {
    if (typeof window !== "undefined" && window.__PLCR_CONFIG__) {
        return window.__PLCR_CONFIG__;
    }
    return DEFAULT_CONFIG;
}

export function getApiUrl(): string {
    return getPlcrConfig().API_URL;
}

export function getAwsRegion(): string {
    return getPlcrConfig().AWS_REGION;
}

export function getEnvironment(): string {
    return getPlcrConfig().ENVIRONMENT;
}

export function getCognitoConfig() {
    const config = getPlcrConfig();
    return {
        userPoolId: config.COGNITO_USER_POOL_ID || "",
        clientId: config.COGNITO_CLIENT_ID || "",
        domain: config.COGNITO_DOMAIN || "",
        region: config.AWS_REGION,
    };
}
