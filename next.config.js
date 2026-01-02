/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com'],

  // Allow iframe embedding (required for İkas Admin and Cloudflare Tunnel)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *.ikas.com *.myikas.com *.trycloudflare.com",
          },
        ],
      },
      // Widget API CORS headers
      {
        source: '/api/widget/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allow all origins for widget (can be restricted to specific domains)
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // Widget static files CORS
      {
        source: '/widget/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, immutable',
          },
        ],
      },
    ];
  },

  // Turbopack configuration (required for Next.js 16+)
  turbopack: {},
  // Webpack configuration
  webpack: (config) => {
    // Disable fs module on client side (required for Vercel)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };


    return config;
  },
};

module.exports = nextConfig; 