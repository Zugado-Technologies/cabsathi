/**
 * On Vercel the API is the `api` service, mounted at /api, and requests keep that
 * prefix (`/api/rides`). Locally it runs on its own port without it (`/rides`).
 * Stripping the prefix lets the same routes answer both.
 */
export const stripApiPrefix = (url = '/') => url.replace(/^\/api(?=\/|\?|$)/, '') || '/';
