import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure correct workspace root when multiple lockfiles are present
    root: __dirname,
  },
};

export default nextConfig;
