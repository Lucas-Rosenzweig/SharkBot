import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
    output: 'standalone',
    outputFileTracingRoot: path.join(import.meta.dirname),
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.API_URL || 'http://localhost:3001'}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
