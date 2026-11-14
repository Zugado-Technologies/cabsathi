import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The shared package is TypeScript source, so Next compiles it.
  transpilePackages: ['@cabsathi/shared'],
  // The logged-in pages load data in the browser, so they can't be "instant";
  // only check pages that opt in with `export const instant = true`.
  experimental: { instantInsights: { validationLevel: 'manual-warning' } },
};

export default nextConfig;
