import { NextRequest, NextResponse } from 'next/server';
import { getUserData, saveUserData, findUserById } from '@/lib/userStore';

export async function GET(req: NextRequest) {
  const sessionUserId = req.cookies.get('pf_session_user_id')?.value;
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
  }

  const userData = getUserData(sessionUserId);
  if (!userData) {
    return NextResponse.json({ error: 'User data file not found.' }, { status: 404 });
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

  const existingData = getUserData(sessionUserId);
  if (!existingData) {
    return NextResponse.json({ error: 'User data file not found.' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'delete_account') {
      existingData.accounts = existingData.accounts.filter(a => a.id !== payload.id);
      saveUserData(sessionUserId, existingData);
      return NextResponse.json({ success: true, data: existingData });
    }

    if (action === 'save_all') {
      if (payload.accounts) existingData.accounts = payload.accounts;
      if (payload.posts) existingData.posts = payload.posts;
      if (payload.autoReplyRules) existingData.autoReplyRules = payload.autoReplyRules;
      saveUserData(sessionUserId, existingData);
      return NextResponse.json({ success: true, data: existingData });
    }

    if (action === 'add_rule') {
      existingData.autoReplyRules = [payload.rule, ...(existingData.autoReplyRules || [])];
      saveUserData(sessionUserId, existingData);
      return NextResponse.json({ success: true, data: existingData });
    }

    if (action === 'delete_rule') {
      existingData.autoReplyRules = (existingData.autoReplyRules || []).filter(r => r.id !== payload.id);
      saveUserData(sessionUserId, existingData);
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
