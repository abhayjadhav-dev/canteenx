const RAW_API_BASE = import.meta.env.VITE_API_URL || '';
// If VITE_API_URL includes /api, strip it for asset URLs like /uploads
const API_BASE = RAW_API_BASE.replace(/\/+$/, '').replace(/\/api$/, '');

/**
 * Normalize image URLs so that:
 * - Absolute URLs (http/https) are returned as-is
 * - `/uploads/...` paths are prefixed with API base in dev/prod
 * - Other relative paths fall back to root
 */
export function resolveImageUrl(url) {
  if (!url) return '';

  // Already absolute (CDN, Unsplash, etc.)
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Normalize leading slash
  let path = url.startsWith('/') ? url : `/${url}`;

  // Uploads served from backend `/uploads`
  if (path.startsWith('/uploads/')) {
    const base = API_BASE;
    // When using Vite proxy in dev, API_BASE may be empty; in that case keep relative
    return base ? `${base}${path}` : path;
  }

  return path;
}

