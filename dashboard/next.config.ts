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
