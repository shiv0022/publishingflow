import type { NextRequest } from 'next/server';

/**
 * Returns the canonical base URL for OAuth callbacks.
 * 
 * Sanitizes NEXT_PUBLIC_APP_URL to guarantee that:
 * 1. Only the origin (protocol + host, e.g. https://publishingflow-r68.vercel.app) is used.
 * 2. Any accidental callback paths (such as /api/oauth/instagram/callback) or trailing slashes are stripped.
 * 3. Never concatenates one platform's callback path with another.
 */
export function getAppBaseUrl(request?: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (envUrl) {
    try {
      const url = new URL(envUrl.startsWith('http') ? envUrl : `https://${envUrl}`);
      // url.origin extracts strictly scheme + host (e.g. "https://publishingflow-r68.vercel.app")
      // Stripping all path segments, query strings, and trailing slashes.
      return url.origin;
    } catch {
      // Fallback regex in case URL constructor fails: remove /api/oauth... paths and trailing slashes
      return envUrl.replace(/\/api\/oauth.*$/i, '').replace(/\/+$/, '');
    }
  }

  if (request) {
    return request.nextUrl.origin;
  }

  return 'https://publishingflow-r68.vercel.app';
}

/**
 * Constructs the canonical OAuth redirect URI for a given platform.
 * 
 * Guarantees:
 * - Facebook: https://publishingflow-r68.vercel.app/api/oauth/facebook/callback
 * - Instagram: https://publishingflow-r68.vercel.app/api/oauth/instagram/callback
 * - YouTube: https://publishingflow-r68.vercel.app/api/oauth/youtube/callback
 */
export function getOAuthRedirectUri(platform: string, request?: NextRequest): string {
  const baseUrl = getAppBaseUrl(request);
  const platformKey = platform.toLowerCase();

  return `${baseUrl}/api/oauth/${platformKey}/callback`;
}
