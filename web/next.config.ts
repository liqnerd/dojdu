import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '1337', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '**.vercel.app' },
      { protocol: 'https', hostname: 'dojdu-cms.onrender.com', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
