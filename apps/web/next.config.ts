import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The shared package is TypeScript source, so Next compiles it.
  transpilePackages: ['@cabsathi/shared'],
};

export default nextConfig;
