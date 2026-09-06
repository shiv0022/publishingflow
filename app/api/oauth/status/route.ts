import { NextResponse } from 'next/server';
import { getCleanMetaCredentials } from '@/lib/oauthUrl';

/**
 * Server-side OAuth configuration check.
 * Strictly returns only boolean flags and safe status messages.
 * NEVER returns raw secrets or API keys to the browser.
 */
export async function GET() {
  const metaCreds = getCleanMetaCredentials();
  const hasMeta = Boolean(metaCreds.clientId && metaCreds.clientSecret);
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

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
