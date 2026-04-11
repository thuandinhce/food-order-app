import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vezjrvmmyhqkzjivxasj.supabase.co',
      },
    ],
  },
};

export default nextConfig;