import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Warning during builds, error during development
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
}

export default nextConfig