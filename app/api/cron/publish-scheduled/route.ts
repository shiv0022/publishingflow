import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { executePublishPost } from '@/lib/publisher';

/**
 * Automated Scheduler & Retry Worker Endpoint
 * 
 * Can be triggered via:
 * 1. Global background runner from client AppContext (every 30-60s)
 * 2. External Cron (Vercel Cron, cron-job.org)
 * 3. Manual "Run Scheduler" button from Dashboard or TopBar
 * 
 * Logic:
 * - Finds posts where status = 'scheduled' AND scheduled_at <= NOW()
 * - Processes each due post through executePublishPost()
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
      .select('id, client_name, platform, scheduled_at, status')
      .eq('status', 'scheduled')
      .lte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (queryErr) {
      throw queryErr;
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({
        message: 'No scheduled posts due for publishing right now.',
        timestamp: nowIso,
        processedCount: 0,
      });
    }

    const results = [];

    // 2. Process each due post
    for (const post of duePosts) {
      try {
        const publishResult = await executePublishPost(post.id);
        results.push({
          id: post.id,
          client: post.client_name,
          platform: post.platform,
          success: publishResult.success,
          error: publishResult.error,
          externalPostId: publishResult.externalPostId,
        });
      } catch (postErr: any) {
        results.push({
          id: post.id,
          client: post.client_name,
          platform: post.platform,
          success: false,
          error: postErr.message,
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${duePosts.length} scheduled post(s).`,
      timestamp: nowIso,
      processedCount: duePosts.length,
      results,
    });
  } catch (err: any) {
    console.error('[Scheduler Worker Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
