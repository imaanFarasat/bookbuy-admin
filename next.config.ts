import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Improve build performance
  swcMinify: true,
  // Handle static files properly
  async rewrites() {
    return [
      {
        source: '/templates/:path*',
        destination: '/templates/templatemo_555_upright/:path*',
      },
      {
        source: '/ma-tem-01/:path*',
        destination: '/templates/templatemo_555_upright/:path*',
      },
    ];
  },
};

export default nextConfig;