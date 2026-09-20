import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/userStore';

export async function GET(req: NextRequest) {
  const sessionUserId = req.cookies.get('pf_session_user_id')?.value;
  if (!sessionUserId) {
    return NextResponse.json({ loggedIn: false, user: null }, { status: 401 });
  }

  const user = await findUserById(sessionUserId);
  if (!user) {
    return NextResponse.json({ loggedIn: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    loggedIn: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      membershipTier: user.membershipTier || 'Free Member',
    },
  });
}
