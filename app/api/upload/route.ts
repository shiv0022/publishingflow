import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error('[Upload API Error]:', uploadErr);
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      mediaType: file.type.startsWith('video') ? 'video' : 'image',
    });
  } catch (err: any) {
    console.error('[Upload Route Exception]:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
