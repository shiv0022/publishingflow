import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/userStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, name, password } = body;

    if (!username || !name || !password) {
      return NextResponse.json(
        { error: 'Name, username, and password are all required.' },
        { status: 400 }
      );
    }

    const result = registerUser({ username, name, password });
    if (!result.success || !result.user) {
      return NextResponse.json({ error: result.error || 'Failed to register.' }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Account created successfully!',
    });

    // Set HTTP-only session cookie for 30 days
    response.cookies.set('pf_session_user_id', result.user.id, {
      httpOnly: false, // allow client-side reading for sync if needed
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('[Register Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
