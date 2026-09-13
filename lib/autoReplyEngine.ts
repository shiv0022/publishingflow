import { getServerRules, incrementServerRuleTrigger, hasRepliedToComment, markCommentReplied } from './autoReplyStore';
import { logAudit } from './auditLogger';

export interface CommentEvent {
  commentId: string;
  commentText: string;
  fromUser?: string;
  fromId?: string;
  platform: 'Instagram' | 'Facebook';
  pageIdOrIgId: string;
  accessToken: string;
  mediaId?: string;
  permalink?: string;
}

export interface AutoReplyExecutionResult {
  triggered: boolean;
  ruleMatched?: string;
  keyword?: string;
  publicReplySuccess?: boolean;
  publicReplyError?: string;
  dmSuccess?: boolean;
  dmError?: string;
  skipReason?: string;
}

/**
 * Execute Auto Reply logic for an incoming comment on Facebook or Instagram
 */
export async function processCommentForAutoReply(
  event: CommentEvent
): Promise<AutoReplyExecutionResult> {
  const {
    commentId,
    commentText,
    fromUser,
    fromId,
    platform,
    pageIdOrIgId,
    accessToken,
    mediaId,
  } = event;

  if (!commentId || !commentText) {
    return { triggered: false, skipReason: 'Missing comment ID or text' };
  }

  // 1. Check if already replied
  if (hasRepliedToComment(commentId)) {
    return { triggered: false, skipReason: 'Already replied to this comment' };
  }

  // 2. Load active rules
  const allRules = getServerRules();
  const activeRules = allRules.filter(
    r => r.isActive && (r.platform === 'All' || r.platform.toLowerCase() === platform.toLowerCase())
  );

  if (activeRules.length === 0) {
    return { triggered: false, skipReason: 'No active rules for platform' };
  }

  // 3. Find matching rule
  const cleanComment = commentText.trim().toLowerCase();
  const matchedRule = activeRules.find(r => {
    if (r.keyword === '*') return true;
    const cleanKw = r.keyword.trim().toLowerCase();
    return cleanComment.includes(cleanKw);
  });

  if (!matchedRule) {
    return { triggered: false, skipReason: `No keyword match for "${commentText}"` };
  }

  console.log(`[Auto Reply Engine] Matched rule "${matchedRule.keyword}" for comment "${commentText}" from ${fromUser || fromId}`);

  let publicReplySuccess = false;
  let publicReplyError: string | undefined;
  let dmSuccess = false;
  let dmError: string | undefined;

  // 4. Send Public Comment Reply
  if (matchedRule.commentReply) {
    try {
      let replyEndpoint = '';
      if (platform === 'Facebook') {
        // Facebook post comment reply: POST /{comment_id}/comments
        replyEndpoint = `https://graph.facebook.com/v22.0/${commentId}/comments`;
      } else {
        // Instagram comment reply: POST /{comment_id}/replies
        replyEndpoint = `https://graph.facebook.com/v22.0/${commentId}/replies`;
      }

      const res = await fetch(replyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: matchedRule.commentReply,
          access_token: accessToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.id) {
        publicReplySuccess = true;
        console.log(`[Auto Reply Engine] Public reply posted successfully: ${data.id}`);
      } else {
        publicReplyError = data.error?.message || 'Failed to post public reply';
        console.warn(`[Auto Reply Engine] Public reply error:`, data);
      }
    } catch (err: any) {
      publicReplyError = err.message;
      console.warn(`[Auto Reply Engine] Public reply fetch error:`, err);
    }
  }

  // 5. Send Private DM Reply (Official Meta Private Replies feature via recipient.comment_id)
  if (matchedRule.dmMessage) {
    try {
      // Both FB Messenger and Instagram support private reply to a comment using recipient: { comment_id }
      const dmEndpoint = `https://graph.facebook.com/v22.0/${pageIdOrIgId}/messages`;
      const res = await fetch(dmEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { comment_id: commentId },
          message: { text: matchedRule.dmMessage },
          access_token: accessToken,
        }),
      });

      const data = await res.json();
      if (res.ok && (data.message_id || data.recipient_id)) {
        dmSuccess = true;
        console.log(`[Auto Reply Engine] Private DM reply sent successfully:`, data);
      } else {
        dmError = data.error?.message || 'Failed to send private DM';
        console.warn(`[Auto Reply Engine] Private DM error:`, data);
      }
    } catch (err: any) {
      dmError = err.message;
      console.warn(`[Auto Reply Engine] Private DM fetch error:`, err);
    }
  }

  // 6. Record and increment trigger
  if (publicReplySuccess || dmSuccess) {
    markCommentReplied({
      commentId,
      platform,
      ruleId: matchedRule.id,
      commentText,
      repliedAt: new Date().toISOString(),
    });
    incrementServerRuleTrigger(matchedRule.id);

    await logAudit({
      action: 'AUTO_REPLY_TRIGGERED',
      entityType: 'post',
      entityId: commentId,
      clientName: fromUser || 'User',
      platform,
      status: 'success',
      details: {
        ruleKeyword: matchedRule.keyword,
        publicReplySuccess,
        dmSuccess,
        commentText,
      },
    });
  }

  return {
    triggered: true,
    ruleMatched: matchedRule.id,
    keyword: matchedRule.keyword,
    publicReplySuccess,
    publicReplyError,
    dmSuccess,
    dmError,
  };
}
