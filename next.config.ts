import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure headers for WebSocket support
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Transpile dependencies if needed
  transpilePackages: ['socket.io-client'],
};

export default nextConfig;