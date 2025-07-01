/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Disable webpack caching to prevent file system errors
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = false;
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  
  // Disable static optimization for problematic routes
  async rewrites() {
    return [
      {
        source: '/api/admin/orders',
        destination: '/api/admin/orders',
      },
    ];
  },
  
  // Add headers to prevent caching issues
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Disable image optimization if causing issues
  images: {
    unoptimized: true,
  },
  
  // Add output configuration
  output: 'standalone',
}

module.exports = nextConfig 