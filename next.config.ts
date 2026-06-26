import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // InsForge storage host (e.g. 68bdfaz8.ap-southeast.insforge.app) for next/image.
    remotePatterns: [{ protocol: 'https', hostname: '**.insforge.app' }],
  },
};

export default nextConfig;
