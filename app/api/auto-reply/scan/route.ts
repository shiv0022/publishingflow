import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getValidAccessToken } from '@/lib/oauthTokens';
import { processCommentForAutoReply, AutoReplyExecutionResult } from '@/lib/autoReplyEngine';

export const dynamic = 'force-dynamic';

/**
 * Live Auto Reply Scanner
 * 
 * Actively checks recent comments on connected Instagram & Facebook accounts
 * and triggers comment-to-DM and automated public replies.
 */
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase configuration is missing.' }, { status: 500 });
  }

  const results: {
    platform: string;
    accountName: string;
    commentsChecked: number;
    repliesTriggered: number;
    details: Array<{
      commentId: string;
      commentText: string;
      result: AutoReplyExecutionResult;
    }>;
  }[] = [];

  try {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
      .eq('connection_status', 'Connected')
      .eq('connection_type', 'oauth');

    for (const acc of accounts || []) {
      if (acc.platform !== 'Facebook' && acc.platform !== 'Instagram') continue;

      try {
        const { accessToken, oauthAccountId } = await getValidAccessToken(acc.id);
        let commentsChecked = 0;
        let repliesTriggered = 0;
        const details: any[] = [];

        // 1. Instagram Comments Scan
        if (acc.platform === 'Instagram') {
          const igUserId = oauthAccountId || 'me';
          const mediaRes = await fetch(
            `https://graph.facebook.com/v22.0/${igUserId}/media?fields=id,caption,permalink&limit=10&access_token=${accessToken}`
          );
          const mediaData = await mediaRes.json();

          for (const media of mediaData.data || []) {
            try {
              const commentsRes = await fetch(
                `https://graph.facebook.com/v22.0/${media.id}/comments?fields=id,text,from,timestamp&limit=25&access_token=${accessToken}`
              );
              const commentsData = await commentsRes.json();

              for (const c of commentsData.data || []) {
                commentsChecked++;
                const execResult = await processCommentForAutoReply({
                  commentId: c.id,
                  commentText: c.text || '',
                  fromUser: c.from?.username,
                  fromId: c.from?.id,
                  platform: 'Instagram',
                  pageIdOrIgId: igUserId,
                  accessToken,
                  mediaId: media.id,
                  permalink: media.permalink,
                });

                if (execResult.triggered) {
                  repliesTriggered++;
                }

                details.push({
                  commentId: c.id,
                  commentText: c.text,
                  result: execResult,
                });
              }
            } catch (cErr) {
              console.warn(`[AutoReply Scan] Failed to check comments for IG media ${media.id}:`, cErr);
            }
          }
        }

        // 2. Facebook Comments Scan
        if (acc.platform === 'Facebook') {
          const pageId = oauthAccountId || 'me';
          const postIds: string[] = [];

          // Published posts & Page posts
          try {
            const pRes = await fetch(
              `https://graph.facebook.com/v22.0/${pageId}/published_posts?fields=id&limit=10&access_token=${accessToken}`
            );
            const pData = await pRes.json();
            for (const p of pData.data || []) postIds.push(p.id);
          } catch {}

          try {
            const pRes2 = await fetch(
              `https://graph.facebook.com/v22.0/${pageId}/posts?fields=id&limit=10&access_token=${accessToken}`
            );
            const pData2 = await pRes2.json();
            for (const p of pData2.data || []) {
              if (!postIds.includes(p.id)) postIds.push(p.id);
            }
          } catch {}

          // Videos / Reels
          try {
            const vRes = await fetch(
              `https://graph.facebook.com/v22.0/${pageId}/videos?fields=id&limit=10&access_token=${accessToken}`
            );
            const vData = await vRes.json();
            for (const v of vData.data || []) {
              if (!postIds.includes(v.id)) postIds.push(v.id);
            }
          } catch {}

          for (const postId of postIds) {
            try {
              const cRes = await fetch(
                `https://graph.facebook.com/v22.0/${postId}/comments?fields=id,message,from,created_time&limit=25&access_token=${accessToken}`
              );
              const cData = await cRes.json();

              for (const c of cData.data || []) {
                commentsChecked++;
                const execResult = await processCommentForAutoReply({
                  commentId: c.id,
                  commentText: c.message || '',
                  fromUser: c.from?.name,
                  fromId: c.from?.id,
                  platform: 'Facebook',
                  pageIdOrIgId: pageId,
                  accessToken,
                  mediaId: postId,
                });

                if (execResult.triggered) {
                  repliesTriggered++;
                }

                details.push({
                  commentId: c.id,
                  commentText: c.message,
                  result: execResult,
                });
              }
            } catch (cErr) {
              console.warn(`[AutoReply Scan] Failed to check comments for FB post ${postId}:`, cErr);
            }
          }
        }

        results.push({
          platform: acc.platform,
          accountName: acc.client_name,
          commentsChecked,
          repliesTriggered,
          details,
        });
      } catch (accErr) {
        console.warn(`[AutoReply Scan] Failed scanning account ${acc.client_name}:`, accErr);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
