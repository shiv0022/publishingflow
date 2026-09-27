import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase admin client is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawName = typeof body.fileName === 'string' ? body.fileName : 'video.mp4';
    const ext = rawName.split('.').pop() || 'mp4';
    const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'mp4';
    
    // Generate isolated temporary transit path
    const transitPath = `temp-transit/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${sanitizedExt}`;

    // Create signed upload authorization with service-role permissions (bypasses RLS)
    const { data: signData, error: signError } = await supabase.storage
      .from('media')
      .createSignedUploadUrl(transitPath, { upsert: true });

    if (signError || !signData) {
      console.error('[Transit Sign Error]:', signError);
      return NextResponse.json({ error: signError?.message || 'Failed to authorize transit upload' }, { status: 500 });
    }

    const { data: pubData } = supabase.storage.from('media').getPublicUrl(transitPath);

    return NextResponse.json({
      success: true,
      token: signData.token,
      signedUrl: signData.signedUrl,
      path: transitPath,
      publicUrl: pubData.publicUrl,
    });
  } catch (err: any) {
    console.error('[Transit Sign Route Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal error authorizing upload' }, { status: 500 });
  }
}
