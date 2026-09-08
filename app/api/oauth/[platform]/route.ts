import { NextRequest, NextResponse } from 'next/server';
import {
  getFacebookOAuthRedirectUri,
  getInstagramOAuthRedirectUri,
  getYouTubeOAuthRedirectUri,
  getCleanMetaCredentials,
  buildFacebookOAuthUrl,
} from '@/lib/oauthUrl';

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

  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get('accountId');
  const stateQuery = accountId ? `&state=${encodeURIComponent(accountId)}` : '';

  if (platformKey === 'facebook') {
    const { clientId, clientSecret } = getCleanMetaCredentials();

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/accounts?error=oauth_not_configured&platform=facebook', request.url)
      );
    }

    const redirectUri = getFacebookOAuthRedirectUri(request);
    const authUrl = buildFacebookOAuthUrl(clientId, redirectUri) + stateQuery;

    return NextResponse.redirect(authUrl);
  }

  if (platformKey === 'instagram') {
    const { clientId, clientSecret } = getCleanMetaCredentials();

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/accounts?error=oauth_not_configured&platform=instagram', request.url)
      );
    }

    const redirectUri = getInstagramOAuthRedirectUri(request);
    const scopes = 'public_profile,instagram_basic,instagram_content_publish,pages_show_list';

    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}&response_type=code${stateQuery}`;

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

    const redirectUri = getYouTubeOAuthRedirectUri(request);
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(authUrl);
  }

  return NextResponse.redirect(new URL('/accounts', request.url));
}
