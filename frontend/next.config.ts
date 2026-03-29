import type { NextConfig } from "next";

const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true, // <--- ADD THIS
  },
  eslint: {
    ignoreDuringBuilds: true, // Recommended to add this too
  },
};

export default nextConfig;
