import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export const DEMO_CLIENT_NAMES = [
  'Apex Fitness Studio',
  'Blue Harbor Bistro',
  'TechCraft Academy',
  'Zenith Real Estate',
  'Horizon Creative Labs',
];

/**
 * Server-Side Demo Data Permanent Cleanup
 * 
 * Permanently removes all demo accounts, posts, and clients from Supabase database.
 */
export async function GET() {
  return handleCleanup();
}

export async function POST() {
  return handleCleanup();
}

async function handleCleanup() {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ success: true, message: 'No Supabase configured, cleaned client storage.' });
  }

  try {
    // 1. Delete all demo posts
    const { error: postErr } = await supabase
      .from('posts')
      .delete()
      .in('client_name', DEMO_CLIENT_NAMES);

    // 2. Delete all demo accounts
    const { error: accErr } = await supabase
      .from('accounts')
      .delete()
      .in('client_name', DEMO_CLIENT_NAMES);

    // 3. Delete all demo clients if clients table exists
    try {
      await supabase
        .from('clients')
        .delete()
        .in('name', DEMO_CLIENT_NAMES);
    } catch {
      // safe catch
    }

    return NextResponse.json({
      success: true,
      message: 'Demo values permanently deleted from database.',
      deletedDemoClients: DEMO_CLIENT_NAMES,
    });
  } catch (err: any) {
    console.error('[Cleanup Demo Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
