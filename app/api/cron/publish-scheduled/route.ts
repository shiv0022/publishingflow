import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getValidAccessToken } from '@/lib/oauthTokens';
import { logAudit } from '@/lib/auditLogger';

/**
 * Automated Scheduler & Retry Worker Endpoint
 * 
 * Can be triggered via:
 * 1. Automated Cron job (e.g. every minute or every 5 minutes)
 * 2. Background scheduler polling from dashboard
 * 
 * Logic:
 * - Finds posts where status = 'scheduled' AND scheduled_at <= NOW()
 * - Processes OAuth posts automatically with auto-refresh & retry logic.
 */
export async function GET(request: NextRequest) {
  return handleScheduleWorker(request);
}

export async function POST(request: NextRequest) {
  return handleScheduleWorker(request);
}

async function handleScheduleWorker(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase server configuration missing.' },
      { status: 500 }
    );
  }

  try {
    const nowIso = new Date().toISOString();

    // 1. Query due scheduled posts
    const { data: duePosts, error: queryErr } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (queryErr) {
      throw queryErr;
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({
        message: 'No scheduled posts due for publishing.',
        timestamp: nowIso,
        processedCount: 0,
      });
    }

    const results = [];

    for (const post of duePosts) {
      // Find account
      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('client_name', post.client_name)
        .eq('platform', post.platform)
        .maybeSingle();

      if (!account) {
        await supabase
          .from('posts')
          .update({
            status: 'failed',
            last_error: `Account for client "${post.client_name}" on ${post.platform} not found.`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        results.push({ id: post.id, status: 'failed', reason: 'Account not found' });
        continue;
      }

      // If account is Manual mode: keep ready for manual publish
      if (account.connection_type !== 'oauth') {
        results.push({ id: post.id, status: 'manual_ready', reason: 'Manual mode account' });
        continue;
      }

      // OAuth Account: Attempt Automatic Publish
      try {
        const { accessToken, oauthAccountId } = await getValidAccessToken(account.id);
        const messageContent = `${post.title ? post.title + '\n\n' : ''}${post.caption || ''}`;
        let externalPostId = '';

        if (account.platform === 'Facebook') {
          const pageId = oauthAccountId || 'me';
          const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: messageContent,
              access_token: accessToken,
            }),
          });
          const fbData = await fbRes.json();
          if (!fbRes.ok || fbData.error) {
            throw new Error(fbData.error?.message || 'Meta Facebook Feed publish failed');
          }
          externalPostId = fbData.id;
        } else if (account.platform === 'Instagram') {
          // Instagram container publish flow
          const igUserId = oauthAccountId || 'me';
          if (!post.media_url || !post.media_url.startsWith('http')) {
            throw new Error('Instagram requires a public media URL');
          }
          const containerRes = await fetch(
            `https://graph.facebook.com/v19.0/${igUserId}/media?image_url=${encodeURIComponent(post.media_url)}&caption=${encodeURIComponent(messageContent)}&access_token=${accessToken}`,
            { method: 'POST' }
          );
          const containerData = await containerRes.json();
          if (!containerRes.ok || !containerData.id) {
            throw new Error(containerData.error?.message || 'Instagram container creation failed');
          }
          await new Promise((r) => setTimeout(r, 2000));
          const pubRes = await fetch(
            `https://graph.facebook.com/v19.0/${igUserId}/media_publish?creation_id=${containerData.id}&access_token=${accessToken}`,
            { method: 'POST' }
          );
          const pubData = await pubRes.json();
          if (!pubRes.ok || !pubData.id) {
            throw new Error(pubData.error?.message || 'Instagram container publish failed');
          }
          externalPostId = pubData.id;
        } else if (account.platform === 'YouTube') {
          // YouTube automated API publish
          throw new Error('YouTube automated upload requires a direct binary video upload');
        }

        // Success: update status to posted
        const publishedTime = new Date().toISOString();
        await supabase
          .from('posts')
          .update({
            status: 'posted',
            published_at: publishedTime,
            retry_count: 0,
            last_error: null,
            updated_at: publishedTime,
          })
          .eq('id', post.id);

        await logAudit({
          action: 'SCHEDULED_POST_PUBLISHED',
          entityType: 'post',
          entityId: post.id,
          clientName: post.client_name,
          platform: post.platform,
          status: 'success',
          details: { externalPostId, scheduledAt: post.scheduled_at },
        });

        results.push({ id: post.id, status: 'posted', externalPostId });
      } catch (pubErr: any) {
        const retries = (post.retry_count || 0) + 1;
        const maxRetries = post.max_retries || 3;
        const finalStatus = retries >= maxRetries ? 'failed' : 'scheduled';

        await supabase
          .from('posts')
          .update({
            retry_count: retries,
            last_error: pubErr.message,
            status: finalStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', post.id);

        await logAudit({
          action: 'SCHEDULED_PUBLISH_RETRY',
          entityType: 'post',
          entityId: post.id,
          clientName: post.client_name,
          platform: post.platform,
          status: 'failed',
          details: { error: pubErr.message, retryCount: retries, maxRetries },
        });

        results.push({ id: post.id, status: finalStatus, retryCount: retries, error: pubErr.message });
      }
    }

    return NextResponse.json({
      message: `Processed ${duePosts.length} scheduled posts.`,
      timestamp: nowIso,
      results,
    });
  } catch (err: any) {
    console.error('[Scheduler Worker Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
