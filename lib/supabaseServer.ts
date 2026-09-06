/**
 * SERVER-SIDE SUPABASE HELPER
 * 
 * CRITICAL SECURITY DIRECTIVES:
 * 1. This file must ONLY be imported in server route handlers (app/api/...) or Server Actions.
 * 2. NEVER import this file into any client component ('use client').
 * 3. SUPABASE_SERVICE_ROLE_KEY and OAuth client secrets MUST NEVER be prefixed with NEXT_PUBLIC_.
 * 4. This guarantees sensitive administrative keys are never leaked to the browser bundle.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate whether serviceRoleKey is a genuine key rather than placeholder
const isValidServiceRole = Boolean(
  rawServiceRoleKey &&
  !rawServiceRoleKey.includes('your-supabase-service-role-key') &&
  rawServiceRoleKey.length > 20
);

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl && (isValidServiceRole || anonKey)
);

// Server-side admin client: uses genuine service role key if configured, otherwise falls back safely to anonKey
export function createServerSupabaseClient() {
  const keyToUse = isValidServiceRole ? rawServiceRoleKey : anonKey;
  if (!supabaseUrl || !keyToUse) {
    return null;
  }
  return createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
