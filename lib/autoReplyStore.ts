import fs from 'fs';
import path from 'path';
import os from 'os';
import { AutoReplyRule } from '@/types';
import { createServerSupabaseClient } from './supabaseServer';

function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );
}

function getDataDir(): string {
  if (isServerless()) {
    return path.join(os.tmpdir(), 'publishingflow_data');
  }
  return path.join(process.cwd(), 'data');
}

function getRulesFile(): string {
  return path.join(getDataDir(), 'auto_reply_rules.json');
}

const defaultRules: AutoReplyRule[] = [
  {
    id: 'default-rule-link',
    platform: 'All',
    keyword: 'LINK',
    dmMessage: 'Hey! 👋 Thanks for asking. Here is the link you requested: https://publishingflow-rc85.vercel.app',
    commentReply: 'Sent you a DM with the link! Check your inbox 🚀',
    isActive: true,
    triggerCount: 0,
    createdAt: new Date().toISOString(),
  },
];

let inMemoryRules: AutoReplyRule[] = [...defaultRules];
const inMemoryRepliedSet = new Set<string>();

function ensureDataDir() {
  try {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn('[AutoReplyStore] Filesystem mkdir note:', err);
  }
}

/**
 * Get all active Auto Reply rules.
 * Synchronizes with Supabase Auth user_metadata so rules persist across Vercel lambda cold starts.
 */
export async function getServerRules(): Promise<AutoReplyRule[]> {
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data: userList, error: listErr } = await supabase.auth.admin.listUsers();
      if (!listErr && userList?.users) {
        const cloudRules: AutoReplyRule[] = [];
        for (const u of userList.users) {
          const rules = u.user_metadata?.autoReplyRules;
          if (Array.isArray(rules)) {
            for (const r of rules) {
              if (r && r.id && !cloudRules.some(existing => existing.id === r.id)) {
                cloudRules.push(r);
              }
            }
          }
        }
        if (cloudRules.length > 0) {
          inMemoryRules = cloudRules;
          return cloudRules;
        }
      }
    } catch (err) {
      console.warn('[AutoReplyStore] Supabase listUsers rules error:', err);
    }
  }

  // Local fallback
  ensureDataDir();
  const rulesFile = getRulesFile();
  try {
    if (fs.existsSync(rulesFile)) {
      const raw = fs.readFileSync(rulesFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryRules = parsed;
        return parsed;
      }
    }
  } catch {}

  return inMemoryRules;
}

export function saveServerRules(rules: AutoReplyRule[]) {
  ensureDataDir();
  inMemoryRules = rules;
  try {
    fs.writeFileSync(getRulesFile(), JSON.stringify(rules, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AutoReplyStore] Save rules warning:', err);
  }
}

export async function addServerRule(rule: AutoReplyRule) {
  const rules = await getServerRules();
  const updated = [rule, ...rules.filter(r => r.id !== rule.id)];
  saveServerRules(updated);
  return rule;
}

export async function updateServerRule(id: string, updates: Partial<AutoReplyRule>) {
  const rules = await getServerRules();
  const updated = rules.map(r => r.id === id ? { ...r, ...updates } : r);
  saveServerRules(updated);
  return updated.find(r => r.id === id);
}

export async function deleteServerRule(id: string) {
  const rules = await getServerRules();
  const updated = rules.filter(r => r.id !== id);
  saveServerRules(updated);
}

export async function incrementServerRuleTrigger(id: string) {
  const rules = await getServerRules();
  const updated = rules.map(r =>
    r.id === id ? { ...r, triggerCount: (r.triggerCount || 0) + 1 } : r
  );
  saveServerRules(updated);
}

/**
 * Check if a comment has already been replied to.
 * Uses persistent Supabase audit_logs so comment IDs are NEVER double-processed,
 * even across serverless restarts or multiple scan triggers.
 */
export async function hasRepliedToComment(commentId: string): Promise<boolean> {
  if (!commentId) return false;

  // 1. Fast in-memory check
  if (inMemoryRepliedSet.has(commentId)) {
    return true;
  }

  // 2. Persistent Supabase audit_logs check
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('action', 'AUTO_REPLY_TRIGGERED')
        .eq('entity_id', commentId)
        .limit(1);

      if (data && data.length > 0) {
        inMemoryRepliedSet.add(commentId);
        return true;
      }
    } catch (err) {
      console.warn('[AutoReplyStore] Error checking Supabase audit_logs:', err);
    }
  }

  return false;
}

export function markCommentReplied(record: {
  commentId: string;
  platform: string;
  ruleId: string;
  commentText: string;
  repliedAt: string;
}) {
  if (record.commentId) {
    inMemoryRepliedSet.add(record.commentId);
  }
}

