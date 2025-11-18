import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for better production builds
  output: 'standalone',
  
  // Rewrite API requests to backend server
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

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