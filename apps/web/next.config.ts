import type { NextConfig } from "next";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  transpilePackages: ['@mega-ticket/shared-types', '@mega-ticket/shared-utils'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${INTERNAL_API_URL}/api/:path*`,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // [V8.0] eslint 설정은 Next.js 15에서 별도 eslint.config.mjs로 분리됨
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};
export default nextConfig;

