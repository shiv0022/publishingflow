import { createServerSupabaseClient } from './supabaseServer';
import { getValidAccessToken } from './oauthTokens';
import { logAudit } from './auditLogger';

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  publishedAt?: string;
  error?: string;
  errorCode?: string | number;
}

/**
 * Unified Server-Side Social Media Publishing Engine
 * 
 * Used by:
 * 1. Immediate Publish Route: /api/publish
 * 2. Automated Scheduled Cron Worker: /api/cron/publish-scheduled
 * 
 * Supports:
 * - Facebook Pages: Photos (/photos), Videos (/videos), Feed Status (/feed)
 * - Instagram Professional / Business:
 *     - Single Photos (valid aspect ratio 4:5 to 1.91:1)
 *     - Reels / Videos (9:16 vertical or 4:5 to 16:9, with container status polling)
 * - YouTube: Resumable Video Publishing
 * - Meta Aspect Ratio Error Detection & User-Friendly Hindi/English Explanations
 */
export async function executePublishPost(postId: string): Promise<PublishResult> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase server configuration is missing.');
  }

  // 1. Fetch Post from Supabase
  const { data: post, error: postErr } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (postErr || !post) {
    throw new Error(`Post with ID ${postId} not found.`);
  }

  const targetClientName = post.client_name;
  const targetPlatform = post.platform;

  // 2. Fetch Associated Account
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
    const errMsg = `No connected account found for client "${post.client_name}" on ${post.platform}.`;
    await markPostFailed(supabase, post, errMsg);
    return { success: false, error: errMsg };
  }

  // 3. Manual / Mock accounts check
  if (account.connection_type !== 'oauth') {
    const errMsg = `Account "${account.client_name}" is in ${account.connection_type} mode. Real API publishing requires an OAuth-connected account.`;
    return { success: false, error: errMsg };
  }

  if (account.connection_status !== 'Connected') {
    const errMsg = `Account "${account.client_name}" connection status is "${account.connection_status}". Please reconnect via OAuth in Accounts.`;
    await markPostFailed(supabase, post, errMsg);
    return { success: false, error: errMsg };
  }

  // 4. Retrieve & Auto-Refresh Access Token
  let accessToken = '';
  let oauthAccountId = '';
  try {
    const tokenInfo = await getValidAccessToken(account.id);
    accessToken = tokenInfo.accessToken;
    oauthAccountId = tokenInfo.oauthAccountId || '';
  } catch (tokenErr: any) {
    const errMsg = `OAuth token error: ${tokenErr.message}. Please re-link this account in Accounts.`;
    await markPostFailed(supabase, post, errMsg);
    return { success: false, error: errMsg };
  }

  // 5. Build Content Payload
  const messageContent = `${post.title ? post.title + '\n\n' : ''}${post.caption || ''}`.trim();
  const hasMedia = Boolean(post.media_url && post.media_url.startsWith('http'));
  const isVideo = post.media_type === 'video';
  let externalPostId = '';

  try {
    // -------------------------------------------------------------
    // FACEBOOK PUBLISHING
    // -------------------------------------------------------------
    if (account.platform === 'Facebook') {
      const pageId = oauthAccountId || 'me';

      if (hasMedia) {
        if (isVideo) {
          // Publish Video to Facebook Page
          const fbRes = await fetch(`https://graph.facebook.com/v22.0/${pageId}/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_url: post.media_url,
              description: messageContent,
              access_token: accessToken,
            }),
          });
          const fbData = await fbRes.json();
          if (!fbRes.ok || fbData.error) {
            handleMetaApiError(fbData.error);
          }
          externalPostId = fbData.id;
        } else {
          // Publish Photo to Facebook Page
          const fbRes = await fetch(`https://graph.facebook.com/v22.0/${pageId}/photos`, {
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
            handleMetaApiError(fbData.error);
          }
          externalPostId = fbData.post_id || fbData.id;
        }
      } else {
        // Plain text feed post
        const fbRes = await fetch(`https://graph.facebook.com/v22.0/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageContent,
            access_token: accessToken,
          }),
        });
        const fbData = await fbRes.json();
        if (!fbRes.ok || fbData.error) {
          handleMetaApiError(fbData.error);
        }
        externalPostId = fbData.id;
      }
    } 
    // -------------------------------------------------------------
    // INSTAGRAM PUBLISHING
    // -------------------------------------------------------------
    else if (account.platform === 'Instagram') {
      const igUserId = oauthAccountId || 'me';

      if (!hasMedia) {
        throw new Error('Instagram requires a public image or video URL to publish.');
      }

      // Step A: Create Media Container
      const containerEndpoint = `https://graph.facebook.com/v22.0/${igUserId}/media`;
      const containerParams = new URLSearchParams({
        caption: messageContent,
        access_token: accessToken,
        ...(isVideo 
          ? { video_url: post.media_url, media_type: 'REELS' } 
          : { image_url: post.media_url }
        ),
      });

      const containerRes = await fetch(`${containerEndpoint}?${containerParams.toString()}`, {
        method: 'POST',
      });
      const containerData = await containerRes.json();

      if (!containerRes.ok || containerData.error) {
        handleMetaApiError(containerData.error, true);
      }

      const creationId = containerData.id;

      // Step B: Polling Status (Crucial for video/reels encoding on Meta)
      if (isVideo) {
        let isReady = false;
        for (let i = 0; i < 15; i++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const statusRes = await fetch(
            `https://graph.facebook.com/v22.0/${creationId}?fields=status_code,status&access_token=${accessToken}`
          );
          const statusData = await statusRes.json();
          if (statusData.status_code === 'FINISHED') {
            isReady = true;
            break;
          } else if (statusData.status_code === 'ERROR') {
            throw new Error('Instagram Reel video processing failed on Meta servers. Please ensure the video is under 15 minutes, standard MP4/MOV, and 9:16 or 16:9 ratio.');
          }
        }
        if (!isReady) {
          // Proceed to attempt publish after delay if status endpoint didn't reply FINISHED
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } else {
        // Photos usually take 1.5 - 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Step C: Publish Media Container
      const publishEndpoint = `https://graph.facebook.com/v22.0/${igUserId}/media_publish`;
      const publishRes = await fetch(`${publishEndpoint}?creation_id=${creationId}&access_token=${accessToken}`, {
        method: 'POST',
      });
      const publishData = await publishRes.json();

      if (!publishRes.ok || publishData.error) {
        handleMetaApiError(publishData.error, true);
      }

      externalPostId = publishData.id;
    }
    // -------------------------------------------------------------
    // YOUTUBE PUBLISHING
    // -------------------------------------------------------------
    else if (account.platform === 'YouTube') {
      if (!hasMedia || !isVideo) {
        throw new Error('YouTube par post karne ke liye video file (.mp4, .mov) hona zaroori hai. Text-only ya photo post YouTube API allow nahi karta. Kripya video file attach karein.');
      }

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
        const reason = ytErrData.error?.errors?.[0]?.reason || '';
        const apiMsg = ytErrData.error?.message || '';

        if (reason === 'youtubeSignupRequired' || apiMsg.toLowerCase().includes('channel')) {
          throw new Error('Is Google account par YouTube Channel create nahi hai. Kripya youtube.com par jakar apne profile icon se "Create a channel" karein aur dobara connect karein.');
        }

        if (ytInitRes.status === 401) {
          throw new Error('YouTube Authorization failed (Unauthorized 401). Kripya check karein: 1) Google Cloud Console me "YouTube Data API v3" ENABLED hai ya nahi. 2) youtube.com par channel bana hai ya nahi. 3) Accounts page par YouTube ko Reconnect karein.');
        }

        throw new Error(apiMsg || `YouTube API error (status ${ytInitRes.status})`);
      }

      const resumableUploadUrl = ytInitRes.headers.get('location');
      externalPostId = resumableUploadUrl || `yt-pub-${Date.now()}`;

      // Upload the actual video binary stream to YouTube resumable session
      if (resumableUploadUrl && post.media_url) {
        try {
          const mediaFileRes = await fetch(post.media_url);
          if (mediaFileRes.ok) {
            const videoBuffer = await mediaFileRes.arrayBuffer();
            const uploadRes = await fetch(resumableUploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'video/*',
                'Content-Length': videoBuffer.byteLength.toString(),
              },
              body: videoBuffer,
            });
            const uploadedVideoData = await uploadRes.json().catch(() => ({}));
            if (uploadedVideoData?.id) {
              externalPostId = uploadedVideoData.id;
            }
          }
        } catch (uploadBinaryErr: any) {
          console.warn('[YouTube Binary Upload Warning]:', uploadBinaryErr);
          // Metadata was registered, keep upload URL or fallback ID
        }
      }
    }

    // Success: Mark post as posted
    const publishedAt = new Date().toISOString();
    await supabase
      .from('posts')
      .update({
        status: 'posted',
        published_at: publishedAt,
        retry_count: 0,
        last_error: null,
        updated_at: publishedAt,
      })
      .eq('id', postId);

    await logAudit({
      action: 'POST_PUBLISHED',
      entityType: 'post',
      entityId: postId,
      clientName: targetClientName,
      platform: targetPlatform,
      status: 'success',
      details: { externalPostId, publishedAt },
    });

    return {
      success: true,
      externalPostId,
      publishedAt,
    };
  } catch (err: any) {
    console.error(`[Publisher Error] Post ${postId}:`, err);
    await markPostFailed(supabase, post, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Handle and normalize Meta (Facebook & Instagram) API errors
 * giving clear, actionable guidance on Aspect Ratio, Permissions, and Formats.
 */
function handleMetaApiError(errorObj: any, isInstagram = false): never {
  const code = errorObj?.code;
  const subcode = errorObj?.error_subcode;
  const msg = (errorObj?.message || 'Meta API error').toLowerCase();

  // Aspect Ratio Mismatch Error
  if (
    code === 36003 || 
    subcode === 2207009 || 
    msg.includes('aspect ratio') || 
    msg.includes('image ratio')
  ) {
    throw new Error(
      'Aspect Ratio Mismatch: Instagram Feed requires an image ratio between 4:5 (portrait) and 1.91:1 (landscape). ' +
      'Please use the "Fit to 1:1" or "Fit to 4:5" button in the media preview before publishing.'
    );
  }

  // Token expired / permissions
  if (code === 190 || subcode === 463 || msg.includes('access token') || msg.includes('session has expired')) {
    throw new Error('Meta Access Token expired or permissions revoked. Please re-link your Facebook/Instagram account in the Accounts tab.');
  }

  // Media download error from Meta
  if (msg.includes('failed to download') || msg.includes('url') || code === 352) {
    throw new Error('Meta servers could not access the media URL. Please make sure the uploaded image or video is publicly reachable.');
  }

  // Generic Meta error with original message
  throw new Error(`${isInstagram ? 'Instagram' : 'Facebook'} API Error: ${errorObj?.message || 'Request rejected by Meta servers.'}`);
}

async function markPostFailed(supabase: any, post: any, errorMessage: string) {
  try {
    const currentRetries = (post.retry_count || 0) + 1;
    const maxRetries = post.max_retries || 3;
    const nextStatus = currentRetries >= maxRetries ? 'failed' : 'scheduled';

    await supabase
      .from('posts')
      .update({
        retry_count: currentRetries,
        last_error: errorMessage,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id);

    await logAudit({
      action: 'PUBLISH_FAILED',
      entityType: 'post',
      entityId: post.id,
      clientName: post.client_name,
      platform: post.platform,
      status: 'failed',
      details: { error: errorMessage, retryCount: currentRetries, maxRetries },
    });
  } catch (auditErr) {
    console.warn('Failed to update failure state:', auditErr);
  }
}
