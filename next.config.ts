import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Railway
  output: 'standalone',

  // Environment variables validation
  env: {
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'production',
    NEXT_TELEMETRY_DISABLED: '1',
  },

  // Optimize for Railway deployment
  experimental: {
    serverMinification: true,
  },

  // Handle webpack compilation issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
