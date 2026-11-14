import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const APP_PATHS = ['/home', '/rides', '/messages', '/profile', '/create-ride', '/matches/', '/login'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: APP_PATHS },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
