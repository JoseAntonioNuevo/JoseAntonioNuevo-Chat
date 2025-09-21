import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure correct workspace root when multiple lockfiles are present
    root: __dirname,
  },
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push('socket.io-client');
    
    // Handle Node.js polyfills for browser environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      dns: false,
      child_process: false,
      tls: false,
      'mime-db': false,
    };
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Permite el iframe desde cualquier origen
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:* https://joseantonionuevo.tech https://*.joseantonionuevo.tech https://webdevfactory.dev https://*.webdevfactory.dev https://*.netlify.app https://*.vercel.app;",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
