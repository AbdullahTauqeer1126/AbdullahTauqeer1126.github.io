import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Turbopack for faster dev builds */
  turbopack: {},
  /* Skip type checking during builds for speed */
  typescript: {
    ignoreBuildErrors: true,
  },
  /* Reduce image optimization overhead */
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
