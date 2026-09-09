/**
 * CLIENT-SIDE SUPABASE HELPER
 * 
 * SECURITY RULES (Strictly Followed):
 * 1. Only NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are used here.
 * 2. NEVER import or use SUPABASE_SERVICE_ROLE_KEY or OAuth client secrets here.
 * 3. Sensitive keys and tokens are strictly handled server-side in API routes.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Account, Post } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Convert Supabase DB row to Account type
export function mapAccountFromDb(row: any): Account {
  return {
    id: row.id,
    clientName: row.client_name,
    platform: row.platform,
    connectionType: row.connection_type || 'manual',
    connectionStatus: row.connection_status,
    oauthAccountId: row.oauth_account_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

// Convert Account type to Supabase DB row
export function mapAccountToDb(account: Omit<Account, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }) {
  return {
    id: account.id,
    client_name: account.clientName,
    platform: account.platform,
    connection_type: account.connectionType,
    connection_status: account.connectionStatus,
    oauth_account_id: account.oauthAccountId || null,
    ...(account.createdAt ? { created_at: account.createdAt } : {}),
    ...(account.updatedAt ? { updated_at: account.updatedAt } : {}),
  };
}

// Convert Supabase DB row to Post type
export function mapPostFromDb(row: any): Post {
  return {
    id: row.id,
    accountId: row.account_id || undefined,
    clientName: row.client_name,
    platform: row.platform,
    title: row.title || '',
    caption: row.caption || '',
    description: row.description || '',
    mediaUrl: row.media_url || undefined,
    mediaType: row.media_type || undefined,
    mediaName: row.media_name || undefined,
    isScheduled: Boolean(row.is_scheduled),
    scheduledAt: row.scheduled_at || undefined,
    status: row.status,
    publishedAt: row.published_at || undefined,
    retryCount: row.retry_count ?? 0,
    maxRetries: row.max_retries ?? 3,
    lastError: row.last_error || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

// Convert Post type to Supabase DB row
export function mapPostToDb(post: Omit<Post, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }) {
  return {
    id: post.id,
    account_id: post.accountId || null,
    client_name: post.clientName,
    platform: post.platform,
    title: post.title || '',
    caption: post.caption || '',
    description: post.description || '',
    media_url: post.mediaUrl || null,
    media_type: post.mediaType || null,
    media_name: post.mediaName || null,
    is_scheduled: post.isScheduled,
    scheduled_at: post.scheduledAt || null,
    status: post.status,
    published_at: post.publishedAt || null,
    retry_count: post.retryCount ?? 0,
    max_retries: post.maxRetries ?? 3,
    last_error: post.lastError || null,
    ...(post.createdAt ? { created_at: post.createdAt } : {}),
    ...(post.updatedAt ? { updated_at: post.updatedAt } : {}),
  };
}
