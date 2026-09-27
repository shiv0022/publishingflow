import { NextRequest, NextResponse } from 'next/server';
import { getUserData, saveUserData, findUserById } from '@/lib/userStore';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { mapPostFromDb } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const sessionUserId = req.cookies.get('pf_session_user_id')?.value;
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const userData = await getUserData(sessionUserId);
  if (!userData) {
    return NextResponse.json({ error: 'User data file not found.' }, { status: 404 });
  }

  // Merge posts from Supabase DB so scheduled and direct posts are always visible
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data: dbPosts } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbPosts && dbPosts.length > 0) {
        const mapped = dbPosts.map(mapPostFromDb);
        const map = new Map();
        for (const p of [...mapped, ...(userData.posts || [])]) {
          map.set(p.id, p);
        }
        userData.posts = Array.from(map.values()).sort((a, b) => {
          const tA = new Date(a.scheduledAt || a.createdAt).getTime();
          const tB = new Date(b.scheduledAt || b.createdAt).getTime();
          return tB - tA;
        });
      }
    } catch (e) {
      console.warn('[UserData Supabase Merge Warning]:', e);
    }
  }

  return NextResponse.json({
    success: true,
    data: userData,
  });
}

export async function POST(req: NextRequest) {
  const sessionUserId = req.cookies.get('pf_session_user_id')?.value;
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const existingData = await getUserData(sessionUserId);
  if (!existingData) {
    return NextResponse.json({ error: 'User data file not found.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'delete_account') {
      existingData.accounts = existingData.accounts.filter(a => a.id !== payload.id);
      await saveUserData(sessionUserId, existingData);
      return NextResponse.json({ success: true, data: existingData });
    }

    if (action === 'save_all') {
      if (payload.accounts) existingData.accounts = payload.accounts;
      if (payload.posts) existingData.posts = payload.posts;
      if (payload.autoReplyRules) existingData.autoReplyRules = payload.autoReplyRules;
      await saveUserData(sessionUserId, existingData);
      return NextResponse.json({ success: true, data: existingData });
    }

    if (action === 'add_rule') {
      existingData.autoReplyRules = [payload.rule, ...(existingData.autoReplyRules || [])];
      await saveUserData(sessionUserId, existingData);
      return NextResponse.json({ success: true, data: existingData });
    }

    if (action === 'delete_rule') {
      existingData.autoReplyRules = (existingData.autoReplyRules || []).filter(r => r.id !== payload.id);
      await saveUserData(sessionUserId, existingData);
      return NextResponse.json({ success: true, data: existingData });
    }

    if (action === 'increment_rule') {
      existingData.autoReplyRules = (existingData.autoReplyRules || []).map(r =>
        r.id === payload.id ? { ...r, triggerCount: (r.triggerCount || 0) + 1 } : r
      );
      saveUserData(sessionUserId, existingData);
      return NextResponse.json({ success: true, data: existingData });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err: any) {
    console.error('[UserData POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to update user data.' }, { status: 500 });
  }
}
