import { Context, Next } from 'hono';

/**
 * Middleware to set security headers
 * Implements defense-in-depth security practices
 */
export async function securityHeaders(c: Context, next: Next) {
  await next();

  // Content Security Policy
  // Allow inline scripts/styles as cclogviewer HTML may require them
  // Allow Tailwind CDN for the upload UI
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'"
  );

  // Prevent clickjacking
  c.header('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Remove X-Powered-By header if it exists
  c.header('X-Powered-By', '');
}
