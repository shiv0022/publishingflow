import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out.' });
  response.cookies.delete('pf_session_user_id');
  return response;
}
