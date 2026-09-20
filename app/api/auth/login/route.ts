import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/userStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Both username and password are required.' },
        { status: 400 }
      );
    }

    const result = authenticateUser(username, password);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Invalid credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Set session cookie
    response.cookies.set('pf_session_user_id', result.user.id, {
      httpOnly: false,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('[Login Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
