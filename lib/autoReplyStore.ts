import fs from 'fs';
import path from 'path';
import os from 'os';
import { AutoReplyRule } from '@/types';

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

function getRepliedFile(): string {
  return path.join(getDataDir(), 'auto_reply_replied.json');
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
let inMemoryReplied: { commentId: string; platform: string; ruleId: string; commentText: string; repliedAt: string }[] = [];

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

export function getServerRules(): AutoReplyRule[] {
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
    fs.writeFileSync(rulesFile, JSON.stringify(defaultRules, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AutoReplyStore] Reading rules fallback to memory:', err);
  }
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
}

export function incrementServerRuleTrigger(id: string) {
  const rules = getServerRules();
  const updated = rules.map(r =>
    r.id === id ? { ...r, triggerCount: (r.triggerCount || 0) + 1 } : r
  );
  saveServerRules(updated);
}

export function getRepliedComments() {
  ensureDataDir();
  const repliedFile = getRepliedFile();
  try {
    if (fs.existsSync(repliedFile)) {
      const raw = fs.readFileSync(repliedFile, 'utf-8');
      inMemoryReplied = JSON.parse(raw);
      return inMemoryReplied;
    }
  } catch {}
  return inMemoryReplied;
}

export function hasRepliedToComment(commentId: string): boolean {
  const replied = getRepliedComments();
  return replied.some(r => r.commentId === commentId);
}

export function markCommentReplied(record: {
  commentId: string;
  platform: string;
  ruleId: string;
  commentText: string;
  repliedAt: string;
}) {
  ensureDataDir();
  inMemoryReplied.push(record);
  try {
    fs.writeFileSync(getRepliedFile(), JSON.stringify(inMemoryReplied, null, 2), 'utf-8');
  } catch {}
}
