import { NextResponse } from 'next/server';
import { getCleanMetaCredentials, getCleanGoogleCredentials } from '@/lib/oauthUrl';

/**
 * Server-side OAuth configuration check.
 * Strictly returns only boolean flags and safe status messages.
 * NEVER returns raw secrets or API keys to the browser.
 */
export async function GET() {
  const metaCreds = getCleanMetaCredentials();
  const googleCreds = getCleanGoogleCredentials();
  const hasMeta = Boolean(metaCreds.clientId && metaCreds.clientSecret);
  const hasGoogle = Boolean(googleCreds.clientId && googleCreds.clientSecret);

  return NextResponse.json({
    configured: {
      instagram: hasMeta,
      facebook: hasMeta,
      youtube: hasGoogle,
    },
    metaConfigured: hasMeta,
    googleConfigured: hasGoogle,
  });
}
