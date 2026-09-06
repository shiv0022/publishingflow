import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getValidAccessToken } from '@/lib/oauthTokens';
import { logAudit } from '@/lib/auditLogger';

/**
 * Server-Side Real Publish Route
 * 
 * SECURITY:
 * - Tokens are NEVER passed from or to the client.
 * - Auto-refreshes tokens via getValidAccessToken().
 * - Real API integration for Facebook, Instagram, and YouTube.
 * - Records execution to audit_logs and updates retry counters.
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase server configuration is missing.' },
      { status: 500 }
    );
  }

  let targetPostId = '';
  let targetClientName = '';
  let targetPlatform = '';

  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 });
    }
    targetPostId = postId;

    // 1. Retrieve Post
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    targetClientName = post.client_name;
    targetPlatform = post.platform;

    // 2. Retrieve Associated Account
    let account = null;
    if (post.account_id) {
      const { data: accById } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', post.account_id)
        .maybeSingle();
      account = accById;
    }

    if (!account) {
      const { data: accByName } = await supabase
        .from('accounts')
        .select('*')
        .eq('client_name', post.client_name)
        .eq('platform', post.platform)
        .maybeSingle();
      account = accByName;
    }

    if (!account) {
      throw new Error(`No social account found for client "${post.client_name}" on ${post.platform}.`);
    }

    // 3. Connection Type Checks
    if (account.connection_type !== 'oauth') {
      return NextResponse.json(
        { 
          error: 'This account is in manual or mock mode. Real publishing is only available for OAuth-connected accounts. Use the manual copy and mark as posted workflow.' 
        },
        { status: 400 }
      );
    }

    if (account.connection_status !== 'Connected') {
      throw new Error(`Account connection status is "${account.connection_status}". Please reconnect via OAuth.`);
    }

    // 4. Retrieve & Auto-Refresh Access Token (Server-Side Only)
    const { accessToken, oauthAccountId } = await getValidAccessToken(account.id);

    // 5. Execute Real Platform API Call
    let externalPostId = '';
    const messageContent = `${post.title ? post.title + '\n\n' : ''}${post.caption || ''}`;

    if (account.platform === 'Facebook') {
      const pageId = oauthAccountId || 'me';

      if (post.media_url && post.media_url.startsWith('http') && post.media_type === 'image') {
        // Publish Photo to Facebook Page
        const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: post.media_url,
            caption: messageContent,
            access_token: accessToken,
          }),
        });
        const fbData = await fbRes.json();
        if (!fbRes.ok || fbData.error) {
          throw new Error(fbData.error?.message || 'Meta Facebook Photo publish failed');
        }
        externalPostId = fbData.post_id || fbData.id;
      } else {
        // Publish Feed Message
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
      }
    } else if (account.platform === 'Instagram') {
      const igUserId = oauthAccountId || 'me';

      if (!post.media_url || !post.media_url.startsWith('http')) {
        throw new Error('Instagram Content Publishing requires a publicly accessible media URL.');
      }

      // Step A: Create Media Container
      const isVideo = post.media_type === 'video';
      const containerEndpoint = `https://graph.facebook.com/v19.0/${igUserId}/media`;
      const containerParams = new URLSearchParams({
        caption: messageContent,
        access_token: accessToken,
        ...(isVideo ? { video_url: post.media_url, media_type: 'VIDEO' } : { image_url: post.media_url }),
      });

      const containerRes = await fetch(`${containerEndpoint}?${containerParams.toString()}`, {
        method: 'POST',
      });
      const containerData = await containerRes.json();
      if (!containerRes.ok || containerData.error) {
        throw new Error(containerData.error?.message || 'Instagram Container creation failed');
      }

      const creationId = containerData.id;

      // Wait a moment for container to initialize
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step B: Publish Container
      const publishEndpoint = `https://graph.facebook.com/v19.0/${igUserId}/media_publish`;
      const publishRes = await fetch(`${publishEndpoint}?creation_id=${creationId}&access_token=${accessToken}`, {
        method: 'POST',
      });
      const publishData = await publishRes.json();
      if (!publishRes.ok || publishData.error) {
        throw new Error(publishData.error?.message || 'Instagram Media publish failed');
      }

      externalPostId = publishData.id;
    } else if (account.platform === 'YouTube') {
      // YouTube Data API v3 video insert
      const snippet = {
        title: post.title || 'Untitled YouTube Video',
        description: `${post.caption || ''}\n\n${post.description || ''}`.trim(),
        tags: ['PublishingFlow'],
        categoryId: '22',
      };
      const status = {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      };

      // Resumable upload or metadata upload
      const ytInitRes = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': 'video/*',
          },
          body: JSON.stringify({ snippet, status }),
        }
      );

      if (!ytInitRes.ok) {
        const ytErrData = await ytInitRes.json().catch(() => ({}));
        throw new Error(ytErrData.error?.message || `YouTube API initiation failed with status ${ytInitRes.status}`);
      }

      externalPostId = ytInitRes.headers.get('location') || `yt-pub-${Date.now()}`;
    }

    // 6. Update Post Success Status & Clear Retries
    const now = new Date().toISOString();
    await supabase
      .from('posts')
      .update({
        status: 'posted',
        published_at: now,
        retry_count: 0,
        last_error: null,
        updated_at: now,
      })
      .eq('id', postId);

    // 7. Log to Audit Trail
    await logAudit({
      action: 'POST_PUBLISHED',
      entityType: 'post',
      entityId: postId,
      clientName: targetClientName,
      platform: targetPlatform,
      status: 'success',
      details: { externalPostId, publishedAt: now },
    });

    return NextResponse.json({
      success: true,
      externalPostId,
      publishedAt: now,
      message: `Successfully published to ${account.platform}!`,
    });
  } catch (err: any) {
    console.error('[Publish API Error]:', err);

    // Increment retry count and log error
    if (targetPostId) {
      try {
        const { data: existingPost } = await supabase
          .from('posts')
          .select('retry_count, max_retries')
          .eq('id', targetPostId)
          .single();

        const currentRetries = (existingPost?.retry_count || 0) + 1;
        const maxRetries = existingPost?.max_retries || 3;
        const nextStatus = currentRetries >= maxRetries ? 'failed' : 'scheduled';

        await supabase
          .from('posts')
          .update({
            retry_count: currentRetries,
            last_error: err.message,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetPostId);

        await logAudit({
          action: 'PUBLISH_FAILED',
          entityType: 'post',
          entityId: targetPostId,
          clientName: targetClientName,
          platform: targetPlatform,
          status: 'failed',
          details: { error: err.message, retryCount: currentRetries, maxRetries },
        });
      } catch (auditErr) {
        console.warn('Failed to update post failure state:', auditErr);
      }
    }

    return NextResponse.json(
      { error: err.message || 'Publishing failed.' },
      { status: 500 }
    );
  }
}
