// public/config.js
// 서울 리전 기본 설정 - 배포 시 리전별로 다른 파일 사용
window.__PLCR_CONFIG__ = {
  API_URL: "https://api.megaticket.click",
  AWS_REGION: "ap-northeast-2",
  PROJECT: "plcr",
  ENVIRONMENT: "prod",
  COGNITO_USER_POOL_ID: "ap-northeast-2_CeuKMd4UK",
  COGNITO_CLIENT_ID: "1vjgbu2a0k3tha9i808h0fu5ie",
  COGNITO_DOMAIN: "auth.megaticket.click",
  AUTH_ENABLED: true,
  AUTH_PROVIDER: "cognito"
};
