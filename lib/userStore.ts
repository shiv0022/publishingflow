import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Account, Post, AutoReplyRule } from '@/types';
import { createServerSupabaseClient } from './supabaseServer';

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  membershipTier?: string;
  passwordHash?: string;
  salt?: string;
  createdAt: string;
}

export interface UserDataFile {
  user: {
    id: string;
    username: string;
    name: string;
    membershipTier?: string;
    createdAt: string;
  };
  accounts: Account[];
  posts: Post[];
  autoReplyRules: AutoReplyRule[];
}

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

function getUsersDir(): string {
  return path.join(getDataDir(), 'users');
}

function formatEmailForUsername(username: string): string {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${clean}@publishingflow.app`;
}

// In-memory cache
const memoryUsers: Map<string, UserRecord> = new Map();
const memoryUserData: Map<string, UserDataFile> = new Map();

function ensureStore() {
  try {
    const dir = getUsersDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {}
}

export function getUserFilePath(userId: string): string {
  return path.join(getUsersDir(), `${userId}.json`);
}

/**
 * Register a user in Supabase Auth (with real user email)
 */
export async function registerUser(data: { email?: string; username?: string; name: string; password: string }): Promise<{
  success: boolean;
  user?: { id: string; username: string; name: string; email?: string; membershipTier?: string };
  error?: string;
}> {
  const cleanName = data.name.trim();
  const password = data.password;

  if (password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }

  // Use the actual email provided by the user
  let email = (data.email || '').trim().toLowerCase();
  let cleanUsername = (data.username || '').trim().toLowerCase();

  if (!email && cleanUsername.includes('@')) {
    email = cleanUsername;
    cleanUsername = email.split('@')[0];
  } else if (!email) {
    email = formatEmailForUsername(cleanUsername || cleanName);
  }

  if (!cleanUsername) {
    cleanUsername = email.split('@')[0];
  }

  const supabase = createServerSupabaseClient();

  if (supabase) {
    try {
      // 1. Check if user already exists with this email
      const { data: userList } = await supabase.auth.admin.listUsers();
      const existing = userList?.users?.find(
        u => u.email === email || (cleanUsername && u.user_metadata?.username === cleanUsername)
      );
      if (existing) {
        return { success: false, error: 'An account with this email or username already exists. Please sign in.' };
      }

      // 2. Create in Supabase Auth with real user email
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username: cleanUsername,
          name: cleanName,
          membershipTier: 'Free Member',
          role: 'member',
          accounts: [],
          autoReplyRules: [],
        },
      });

      if (createErr || !newUser?.user) {
        return { success: false, error: createErr?.message || 'Failed to create user in database.' };
      }

      const createdUser = {
        id: newUser.user.id,
        username: cleanUsername,
        name: cleanName,
        email: email,
        membershipTier: 'Free Member',
      };

      // Cache locally
      const initialData: UserDataFile = {
        user: {
          id: createdUser.id,
          username: cleanUsername,
          name: cleanName,
          membershipTier: 'Free Member',
          createdAt: new Date().toISOString(),
        },
        accounts: [],
        posts: [],
        autoReplyRules: [],
      };
      memoryUserData.set(createdUser.id, initialData);

      try {
        ensureStore();
        fs.writeFileSync(getUserFilePath(createdUser.id), JSON.stringify(initialData, null, 2), 'utf-8');
      } catch {}

      return { success: true, user: createdUser };
    } catch (err: any) {
      console.error('[UserStore Supabase Register Error]:', err);
    }
  }

  // Local fallback if Supabase is unavailable
  ensureStore();
  const userId = `usr_${cleanUsername}`;
  const userRec: UserRecord = {
    id: userId,
    username: cleanUsername,
    name: cleanName,
    membershipTier: 'Free Member',
    createdAt: new Date().toISOString(),
  };
  memoryUsers.set(userId, userRec);

  const initialData: UserDataFile = {
    user: {
      id: userId,
      username: cleanUsername,
      name: cleanName,
      membershipTier: 'Free Member',
      createdAt: new Date().toISOString(),
    },
    accounts: [],
    posts: [],
    autoReplyRules: [],
  };
  memoryUserData.set(userId, initialData);

  try {
    fs.writeFileSync(getUserFilePath(userId), JSON.stringify(initialData, null, 2), 'utf-8');
  } catch {}

  return { success: true, user: userRec };
}

/**
 * Authenticate user via Supabase Auth (with local fallback)
 */
export async function authenticateUser(usernameOrEmail: string, password: string): Promise<{
  success: boolean;
  user?: { id: string; username: string; name: string; membershipTier?: string };
  error?: string;
}> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const supabase = createServerSupabaseClient();

  if (supabase) {
    try {
      // 1. Resolve email
      let email = cleanInput;
      if (!cleanInput.includes('@')) {
        email = formatEmailForUsername(cleanInput);
      }

      // Try sign in
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInErr && signInData.user) {
        const u = signInData.user;
        const meta = u.user_metadata || {};
        const userObj = {
          id: u.id,
          username: meta.username || cleanInput.split('@')[0],
          name: meta.name || cleanInput.split('@')[0],
          membershipTier: meta.membershipTier || 'Free Member',
        };

        // Sync local cache
        if (!memoryUserData.has(u.id)) {
          memoryUserData.set(u.id, {
            user: { ...userObj, createdAt: u.created_at },
            accounts: meta.accounts || [],
            posts: meta.posts || [],
            autoReplyRules: meta.autoReplyRules || [],
          });
        }

        return { success: true, user: userObj };
      }

      // If direct email failed, attempt lookup by username in user_metadata
      const { data: userList } = await supabase.auth.admin.listUsers();
      const matched = userList?.users?.find(
        u => u.user_metadata?.username === cleanInput || u.email === cleanInput
      );

      if (matched && matched.email) {
        const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
          email: matched.email,
          password,
        });

        if (!retryErr && retryData.user) {
          const u = retryData.user;
          const meta = u.user_metadata || {};
          const userObj = {
            id: u.id,
            username: meta.username || cleanInput,
            name: meta.name || cleanInput,
            membershipTier: meta.membershipTier || 'Free Member',
          };
          return { success: true, user: userObj };
        }
      }

      return { success: false, error: 'Incorrect username or password. Please try again.' };
    } catch (err: any) {
      console.error('[UserStore Supabase Login Error]:', err);
    }
  }

  // Fallback in-memory / local files
  for (const [id, u] of memoryUsers.entries()) {
    if (u.username === cleanInput) {
      return { success: true, user: u };
    }
  }

  return { success: false, error: 'User not found. Please register first.' };
}

/**
 * Find user by ID (Supabase Auth first, then local cache)
 */
export async function findUserById(userId: string): Promise<UserRecord | null> {
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data?.user) {
        const meta = data.user.user_metadata || {};
        return {
          id: data.user.id,
          username: meta.username || data.user.email?.split('@')[0] || 'user',
          name: meta.name || 'User',
          membershipTier: meta.membershipTier || 'Free Member',
          createdAt: data.user.created_at,
        };
      }
    } catch {}
  }

  if (memoryUsers.has(userId)) return memoryUsers.get(userId)!;
  if (memoryUserData.has(userId)) {
    const d = memoryUserData.get(userId)!;
    return {
      id: d.user.id,
      username: d.user.username,
      name: d.user.name,
      membershipTier: d.user.membershipTier || 'Free Member',
      createdAt: d.user.createdAt,
    };
  }

  return null;
}

/**
 * Get user data (Accounts, Posts, Rules) with Supabase persistence
 */
export async function getUserData(userId: string): Promise<UserDataFile | null> {
  // Check in-memory cache
  if (memoryUserData.has(userId)) {
    return memoryUserData.get(userId)!;
  }

  // Check file on disk
  const filePath = getUserFilePath(userId);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryUserData.set(userId, parsed);
      return parsed;
    }
  } catch {}

  // Fetch from Supabase Auth user_metadata
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data?.user) {
        const meta = data.user.user_metadata || {};
        const userData: UserDataFile = {
          user: {
            id: data.user.id,
            username: meta.username || data.user.email?.split('@')[0] || 'user',
            name: meta.name || 'User',
            membershipTier: meta.membershipTier || 'Free Member',
            createdAt: data.user.created_at,
          },
          accounts: meta.accounts || [],
          posts: meta.posts || [],
          autoReplyRules: meta.autoReplyRules || [],
        };
        memoryUserData.set(userId, userData);
        return userData;
      }
    } catch {}
  }

  return null;
}

/**
 * Save user data (persist to Supabase Auth user_metadata and local disk)
 */
export async function saveUserData(userId: string, data: UserDataFile) {
  memoryUserData.set(userId, data);

  // 1. Persist to disk
  try {
    ensureStore();
    fs.writeFileSync(getUserFilePath(userId), JSON.stringify(data, null, 2), 'utf-8');
  } catch {}

  // 2. Persist to Supabase Auth metadata
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          username: data.user.username,
          name: data.user.name,
          membershipTier: data.user.membershipTier || 'Free Member',
          accounts: data.accounts,
          posts: data.posts,
          autoReplyRules: data.autoReplyRules,
        },
      });
    } catch (err) {
      console.warn(`[UserStore] Supabase save error for ${userId}:`, err);
    }
  }
}

/**
 * Add or update an account for a user
 */
export async function addAccountToUser(userId: string, account: Account): Promise<boolean> {
  const data = await getUserData(userId);
  if (!data) return false;

  const existingIdx = data.accounts.findIndex(
    a => a.id === account.id || (a.platform === account.platform && a.clientName === account.clientName)
  );

  if (existingIdx >= 0) {
    data.accounts[existingIdx] = account;
  } else {
    data.accounts.unshift(account);
  }

  await saveUserData(userId, data);
  return true;
}

/**
 * Remove an account from user
 */
export async function removeAccountFromUser(userId: string, accountId: string): Promise<boolean> {
  const data = await getUserData(userId);
  if (!data) return false;

  data.accounts = data.accounts.filter(a => a.id !== accountId);
  await saveUserData(userId, data);
  return true;
}
