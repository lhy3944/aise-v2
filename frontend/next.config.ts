import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  allowedDevOrigins: ['dev.devbanjang.cloud', 'local-aise.lge.com'],
};

export default nextConfig;
