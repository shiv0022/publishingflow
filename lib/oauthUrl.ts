import type { NextRequest } from 'next/server';

/**
 * The canonical production base URL for PublishingFlow.
 */
export const CANONICAL_APP_BASE_URL = 'https://publishingflow-rc68.vercel.app';

/**
 * Returns the sanitized base URL of the application.
 * 
 * Strict sanitization guarantees:
 * 1. Only protocol + hostname is used (e.g., https://publishingflow-rc68.vercel.app).
 * 2. If NEXT_PUBLIC_APP_URL accidentally contains a callback URL (like /api/oauth/instagram/callback)
 *    or trailing slashes, they are completely stripped away.
 * 3. Never allows one provider's callback URL to be appended onto another.
 */
export function getAppBaseUrl(request?: NextRequest): string {
  let envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/^["']|["']$/g, '');

  if (envUrl) {
    // Aggressively strip any accidental callback paths or subpaths
    envUrl = envUrl.replace(/\/api\/oauth.*$/i, '').replace(/\/+$/, '');

    try {
      const parsed = new URL(envUrl.startsWith('http') ? envUrl : `https://${envUrl}`);
      // parsed.origin extracts strictly "https://publishingflow-rc68.vercel.app"
      return parsed.origin;
    } catch {
      const match = envUrl.match(/^(https?:\/\/[^\/\s]+)/i);
      if (match) {
        return match[1];
      }
    }
  }

  if (request) {
    return request.nextUrl.origin;
  }

  return CANONICAL_APP_BASE_URL;
}

/**
 * Distinct, isolated callback URL for Facebook OAuth.
 * Guaranteed to NEVER concatenate with Instagram or any other callback.
 * Evaluates to: https://publishingflow-rc68.vercel.app/api/oauth/facebook/callback
 */
export function getFacebookOAuthRedirectUri(request?: NextRequest): string {
  const base = getAppBaseUrl(request);
  return `${base}/api/oauth/facebook/callback`;
}

/**
 * Distinct, isolated callback URL for Instagram OAuth.
 * Guaranteed to NEVER concatenate with Facebook or any other callback.
 * Evaluates to: https://publishingflow-rc68.vercel.app/api/oauth/instagram/callback
 */
export function getInstagramOAuthRedirectUri(request?: NextRequest): string {
  const base = getAppBaseUrl(request);
  return `${base}/api/oauth/instagram/callback`;
}

/**
 * Distinct, isolated callback URL for YouTube OAuth.
 * Evaluates to: https://publishingflow-rc68.vercel.app/api/oauth/youtube/callback
 */
export function getYouTubeOAuthRedirectUri(request?: NextRequest): string {
  const base = getAppBaseUrl(request);
  return `${base}/api/oauth/youtube/callback`;
}

/**
 * Provider-specific OAuth redirect URI resolver.
 */
export function getOAuthRedirectUri(platform: string, request?: NextRequest): string {
  const key = platform.toLowerCase();
  if (key === 'facebook') return getFacebookOAuthRedirectUri(request);
  if (key === 'instagram') return getInstagramOAuthRedirectUri(request);
  if (key === 'youtube') return getYouTubeOAuthRedirectUri(request);

  const base = getAppBaseUrl(request);
  return `${base}/api/oauth/${key}/callback`;
}

/**
 * Resolves clean Meta credentials (App ID and Secret).
 * 
 * Guarantees:
 * 1. Strips any accidental 'your-' prefix (e.g., 'your-1077484934693230' -> '1077484934693230').
 * 2. Checks META_CLIENT_ID, META_APP_ID, and FACEBOOK_APP_ID.
 * 3. Strips any surrounding quotes or whitespace.
 */
export function getCleanMetaCredentials(): { clientId?: string; clientSecret?: string } {
  const rawId = (
    process.env.META_CLIENT_ID ||
    process.env.META_APP_ID ||
    process.env.FACEBOOK_APP_ID
  )?.trim().replace(/^["']|["']$/g, '');

  const rawSecret = (
    process.env.META_CLIENT_SECRET ||
    process.env.META_APP_SECRET ||
    process.env.FACEBOOK_APP_SECRET
  )?.trim().replace(/^["']|["']$/g, '');

  const clientId = rawId ? rawId.replace(/^your-/i, '') : undefined;
  const clientSecret = rawSecret ? rawSecret.replace(/^your-/i, '') : undefined;

  return { clientId, clientSecret };
}

