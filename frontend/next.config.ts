import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow builds to complete even if there are TypeScript or ESLint errors
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
