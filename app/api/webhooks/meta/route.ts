import { NextRequest, NextResponse } from 'next/server';

/**
 * Meta Webhooks Handler for Instagram & Facebook
 * 
 * GET: Handles the Meta Webhook Verification challenge handshake
 * POST: Receives real-time events (e.g. comments on Instagram Reel / Facebook Page)
 *       and triggers automated private DM reply or public comment reply.
 */

const META_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'publishingflow_meta_token';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('[Meta Webhook] Successfully verified handshake with challenge:', challenge);
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Verification failed: invalid token or mode.' }, { status: 403 });
}

import { processCommentForAutoReply } from '@/lib/autoReplyEngine';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getValidAccessToken } from '@/lib/oauthTokens';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Meta Webhook] Received webhook payload:', JSON.stringify(body, null, 2));

    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ status: 'NO_DB' }, { status: 200 });
    }

    // Check if entry contains changes
    if (body.object === 'instagram' || body.object === 'page') {
      for (const entry of body.entry || []) {
        const entryId = entry.id; // page id or ig user id

        // Find connected account matching this page/ig ID
        const { data: accounts } = await supabase
          .from('accounts')
          .select('*')
          .eq('oauth_account_id', entryId)
          .eq('connection_status', 'Connected')
          .limit(1);

        const acc = accounts?.[0];
        let accessToken = acc?.oauth_access_token;

        if (acc) {
          try {
            const valid = await getValidAccessToken(acc.id);
            accessToken = valid.accessToken;
          } catch {}
        }

        // 1. Handle Instagram & Facebook comments
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments' || change.field === 'feed') {
              const value = change.value;
              const commentText = value?.text || value?.message || '';
              const commentId = value?.id || value?.comment_id;
              const fromUser = value?.from?.username || value?.from?.name;
              const fromId = value?.from?.id;
              const mediaId = value?.media?.id || value?.post_id;

              if (commentId && commentText && accessToken) {
                console.log(`[Meta Webhook] Processing comment "${commentText}" (ID: ${commentId})`);
                await processCommentForAutoReply({
                  commentId,
                  commentText,
                  fromUser,
                  fromId,
                  platform: body.object === 'instagram' ? 'Instagram' : 'Facebook',
                  pageIdOrIgId: entryId,
                  accessToken,
                  mediaId,
                });
              }
            }
          }
        }
      }

      return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
    }

    return NextResponse.json({ status: 'IGNORED' }, { status: 200 });
  } catch (err: any) {
    console.error('[Meta Webhook] Error processing event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
