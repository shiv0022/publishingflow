import fs from 'fs';
import path from 'path';
import { AutoReplyRule } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const RULES_FILE = path.join(DATA_DIR, 'auto_reply_rules.json');
const REPLIED_FILE = path.join(DATA_DIR, 'auto_reply_replied.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getServerRules(): AutoReplyRule[] {
  ensureDataDir();
  if (!fs.existsSync(RULES_FILE)) {
    // Default initial rule
    const initialRules: AutoReplyRule[] = [
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
    fs.writeFileSync(RULES_FILE, JSON.stringify(initialRules, null, 2), 'utf-8');
    return initialRules;
  }

  try {
    const raw = fs.readFileSync(RULES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[AutoReplyStore] Failed to read rules file:', err);
    return [];
  }
}

export function saveServerRules(rules: AutoReplyRule[]) {
  ensureDataDir();
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), 'utf-8');
}

export function addServerRule(rule: AutoReplyRule) {
  const rules = getServerRules();
  const updated = [rule, ...rules.filter(r => r.id !== rule.id)];
  saveServerRules(updated);
  return rule;
}

export function updateServerRule(id: string, updates: Partial<AutoReplyRule>) {
  const rules = getServerRules();
  const updated = rules.map(r => r.id === id ? { ...r, ...updates } : r);
  saveServerRules(updated);
  return updated.find(r => r.id === id);
}

export function deleteServerRule(id: string) {
  const rules = getServerRules();
  const updated = rules.filter(r => r.id !== id);
  saveServerRules(updated);
  return true;
}

export function incrementServerRuleTrigger(id: string) {
  const rules = getServerRules();
  const updated = rules.map(r => r.id === id ? { ...r, triggerCount: (r.triggerCount || 0) + 1 } : r);
  saveServerRules(updated);
}

// Track replied comment IDs to avoid sending duplicate replies
export interface RepliedRecord {
  commentId: string;
  platform: string;
  ruleId: string;
  commentText: string;
  repliedAt: string;
}

export function getRepliedComments(): RepliedRecord[] {
  ensureDataDir();
  if (!fs.existsSync(REPLIED_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(REPLIED_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function hasRepliedToComment(commentId: string): boolean {
  const records = getRepliedComments();
  return records.some(r => r.commentId === commentId);
}

export function markCommentReplied(record: RepliedRecord) {
  ensureDataDir();
  const records = getRepliedComments();
  if (!records.some(r => r.commentId === record.commentId)) {
    records.push(record);
    // Keep max 1000 latest records
    if (records.length > 1000) records.shift();
    fs.writeFileSync(REPLIED_FILE, JSON.stringify(records, null, 2), 'utf-8');
  }
}
