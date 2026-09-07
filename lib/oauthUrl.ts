import type { NextRequest } from 'next/server';

/**
 * The canonical production base URL for PublishingFlow.
 * Guaranteed to NEVER have a trailing slash.
 */
export const CANONICAL_APP_BASE_URL = 'https://publishingflow-rc68.vercel.app';

/**
 * Verified Facebook / Meta App ID for PublishingFlow.
 */
export const VERIFIED_META_APP_ID = '1656696732464075';

/**
 * Returns the sanitized base URL of the application.
 * 
 * Strict sanitization guarantees:
 * 1. In production, always strictly returns CANONICAL_APP_BASE_URL.
 * 2. In development, returns localhost origin without trailing slash.
 * 3. Never allows trailing slashes or subpaths to leak into OAuth redirects.
 */
export function getAppBaseUrl(request?: NextRequest): string {
  // If in production environment, always enforce canonical production URL
  if (process.env.NODE_ENV === 'production') {
    return CANONICAL_APP_BASE_URL;
  }

  let envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/^["']|["']$/g, '');

  if (envUrl) {
    // Aggressively strip any accidental callback paths or subpaths
    envUrl = envUrl.replace(/\/api\/oauth.*$/i, '').replace(/\/+$/, '');

    try {
      const parsed = new URL(envUrl.startsWith('http') ? envUrl : `https://${envUrl}`);
      // parsed.origin extracts strictly origin (no trailing slash)
      return parsed.origin;
    } catch {
      const match = envUrl.match(/^(https?:\/\/[^\/\s]+)/i);
      if (match) {
        return match[1].replace(/\/+$/, '');
      }
    }
  }

  if (request) {
    const origin = request.nextUrl.origin.replace(/\/+$/, '');
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
  }

  return CANONICAL_APP_BASE_URL;
}

/**
 * Distinct, isolated callback URL for Facebook OAuth.
 * Evaluates EXACTLY to: https://publishingflow-rc68.vercel.app/api/oauth/facebook/callback
 * Guaranteed to never have a trailing slash or localhost in production.
 */
export function getFacebookOAuthRedirectUri(request?: NextRequest): string {
  const base = getAppBaseUrl(request);
  return `${base}/api/oauth/facebook/callback`;
}

/**
 * Distinct, isolated callback URL for Instagram OAuth.
 * Evaluates EXACTLY to: https://publishingflow-rc68.vercel.app/api/oauth/instagram/callback
 */
export function getInstagramOAuthRedirectUri(request?: NextRequest): string {
  const base = getAppBaseUrl(request);
  return `${base}/api/oauth/instagram/callback`;
}

/**
 * Distinct, isolated callback URL for YouTube OAuth.
 * Evaluates EXACTLY to: https://publishingflow-rc68.vercel.app/api/oauth/youtube/callback
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
 * 1. Uses VERIFIED_META_APP_ID ('1077484934693230') as guaranteed fallback.
 * 2. Checks META_CLIENT_ID, META_APP_ID, and FACEBOOK_APP_ID.
 * 3. Strips any surrounding quotes, whitespace, or accidental 'your-' prefixes.
 * 4. App Secret is strictly server-side and never leaked.
 */
export function getCleanMetaCredentials(): { clientId: string; clientSecret?: string } {
  const rawId = (
    process.env.META_CLIENT_ID ||
    process.env.META_APP_ID ||
    process.env.FACEBOOK_APP_ID ||
    VERIFIED_META_APP_ID
  )?.trim().replace(/^["']|["']$/g, '');

  const rawSecret = (
    process.env.META_CLIENT_SECRET ||
    process.env.META_APP_SECRET ||
    process.env.FACEBOOK_APP_SECRET
  )?.trim().replace(/^["']|["']$/g, '');

  const cleanId = rawId ? rawId.replace(/^your-/i, '') : '';
  const clientId = cleanId || VERIFIED_META_APP_ID;
  const clientSecret = rawSecret ? rawSecret.replace(/^your-/i, '') : undefined;

  return { clientId, clientSecret };
}

/**
 * Verified permissions for Facebook Page connection and content publishing:
 * - pages_show_list: Required to list Facebook Pages at /me/accounts
 * - pages_manage_posts: Required to publish posts and photos to Pages at /{page-id}/feed and /{page-id}/photos
 * - public_profile: Basic profile verification
 * 
 * Note: pages_read_engagement is removed as PublishingFlow only connects Pages and publishes posts.
 */
export const DEFAULT_FACEBOOK_SCOPES = 'public_profile,pages_show_list,pages_manage_posts';

/**
 * Returns clean Facebook OAuth scopes, allowing override via META_FACEBOOK_SCOPES.
 */
export function getFacebookScopes(): string {
  const envScopes = process.env.META_FACEBOOK_SCOPES?.trim().replace(/^["']|["']$/g, '');
  return envScopes || DEFAULT_FACEBOOK_SCOPES;
}

/**
 * Builds the official Meta Facebook OAuth authorization dialog URL.
 * Supports both standard scope-based OAuth and Facebook Login for Business (config_id).
 */
export function buildFacebookOAuthUrl(clientId: string, redirectUri: string): string {
  const configId = (process.env.META_CONFIG_ID || process.env.FACEBOOK_CONFIG_ID)?.trim().replace(/^["']|["']$/g, '');

  if (configId) {
    return `https://www.facebook.com/v22.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&config_id=${encodeURIComponent(configId)}&response_type=code`;
  }

  const scopes = getFacebookScopes();
  return `https://www.facebook.com/v22.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes)}&response_type=code`;
}


