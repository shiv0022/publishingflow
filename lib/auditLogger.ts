import { createServerSupabaseClient } from './supabaseServer';
import { AuditLog } from '@/types';

/**
 * Server-Side Audit Logger
 * Strictly server-side to prevent tampering.
 * Records every post creation, schedule, publish attempt, token refresh, and deletion.
 */
export async function logAudit(entry: {
  action: string;
  entityType: 'post' | 'account' | 'client' | 'system';
  entityId?: string;
  clientName?: string;
  platform?: string;
  status: 'success' | 'failed' | 'info' | 'warning';
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      console.log('[Audit Log - Local]:', entry);
      return;
    }

    const { error } = await supabase.from('audit_logs').insert({
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      client_name: entry.clientName || null,
      platform: entry.platform || null,
      status: entry.status,
      details: entry.details || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Table may not be created yet in user's SQL editor; log gracefully to stdout
      console.warn('[Audit Log Warning - Table might need schema.sql]:', error.message, entry);
    }
  } catch (err) {
    console.error('[Audit Log Error]:', err);
  }
}
