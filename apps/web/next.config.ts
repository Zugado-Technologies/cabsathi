import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The shared package is TypeScript source, so Next compiles it.
  transpilePackages: ['@cabsathi/shared'],
  // The logged-in pages load data in the browser, so they can't be "instant";
  // only check pages that opt in with `export const instant = true`.
  experimental: { instantInsights: { validationLevel: 'manual-warning' } },
  // Locally, send /api to the API server. On Vercel the root vercel.json routes /api
  // to the `api` service before requests reach Next.js.
  async rewrites() {
    if (process.env.VERCEL) return [];
    const api = process.env.API_DEV_ORIGIN ?? 'http://localhost:4000';
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
