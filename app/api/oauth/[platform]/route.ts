import { NextRequest, NextResponse } from 'next/server';
import { getOAuthRedirectUri } from '@/lib/oauthUrl';

/**
 * Server-Side OAuth Initiation Handler
 * 
 * Never exposes secrets to the browser.
 * Validates credentials server-side and redirects to provider OAuth login.
 * If credentials are not configured, redirects back with an error code.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params;
  const platformKey = platform.toLowerCase();

  if (platformKey === 'facebook') {
    const clientId = process.env.META_CLIENT_ID;
    const clientSecret = process.env.META_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/accounts?error=oauth_not_configured&platform=facebook', request.url)
      );
    }

    const redirectUri = getOAuthRedirectUri('facebook', request);
    const scopes = 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts';

    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}&response_type=code`;

    return NextResponse.redirect(authUrl);
  }

  if (platformKey === 'instagram') {
    const clientId = process.env.META_CLIENT_ID;
    const clientSecret = process.env.META_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/accounts?error=oauth_not_configured&platform=instagram', request.url)
      );
    }

    const redirectUri = getOAuthRedirectUri('instagram', request);
    const scopes = 'public_profile,instagram_basic,instagram_content_publish,pages_show_list';

    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}&response_type=code`;

    return NextResponse.redirect(authUrl);
  }

  if (platformKey === 'youtube') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/accounts?error=oauth_not_configured&platform=youtube', request.url)
      );
    }

    const redirectUri = getOAuthRedirectUri('youtube', request);
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(authUrl);
  }

  return NextResponse.redirect(new URL('/accounts', request.url));
}
