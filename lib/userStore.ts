import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Account, Post, AutoReplyRule } from '@/types';

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface UserDataFile {
  user: {
    id: string;
    username: string;
    name: string;
    createdAt: string;
  };
  accounts: Account[];
  posts: Post[];
  autoReplyRules: AutoReplyRule[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Fallback in-memory state for serverless environments
const defaultSalt = 'a1b2c3d4e5f67890123456789abcdef0';
const defaultHash = hashPassword('rachit123', defaultSalt);

const defaultRachitRecord: UserRecord = {
  id: 'usr_rachit',
  username: 'rachit',
  name: 'Rachit Chauhan',
  passwordHash: defaultHash,
  salt: defaultSalt,
  createdAt: '2026-09-20T00:00:00.000Z',
};

const defaultRachitData: UserDataFile = {
  user: {
    id: 'usr_rachit',
    username: 'rachit',
    name: 'Rachit Chauhan',
    createdAt: '2026-09-20T00:00:00.000Z',
  },
  accounts: [],
  posts: [],
  autoReplyRules: [],
};

const memoryUsers: Map<string, UserRecord> = new Map([
  [defaultRachitRecord.id, defaultRachitRecord],
]);
const memoryUserData: Map<string, UserDataFile> = new Map([
  [defaultRachitRecord.id, JSON.parse(JSON.stringify(defaultRachitData))],
]);

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

function getUsersIndexFile(): string {
  return path.join(getDataDir(), 'users_index.json');
}

export function ensureStore() {
  const dataDir = getDataDir();
  const usersDir = getUsersDir();
  const usersIndexFile = getUsersIndexFile();

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(usersDir)) {
      fs.mkdirSync(usersDir, { recursive: true });
    }

    if (!fs.existsSync(usersIndexFile)) {
      fs.writeFileSync(usersIndexFile, JSON.stringify([defaultRachitRecord], null, 2), 'utf-8');

      const rachitFilePath = path.join(usersDir, 'usr_rachit.json');
      fs.writeFileSync(rachitFilePath, JSON.stringify(defaultRachitData, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[UserStore] Filesystem setup note (using memory/tmp fallback):', err);
  }
}

export function getAllUsers(): UserRecord[] {
  ensureStore();
  const usersIndexFile = getUsersIndexFile();
  try {
    if (fs.existsSync(usersIndexFile)) {
      const raw = fs.readFileSync(usersIndexFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(u => memoryUsers.set(u.id, u));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[UserStore] Reading index fallback to memory:', err);
  }
  return Array.from(memoryUsers.values());
}

export function findUserByUsername(username: string): UserRecord | null {
  const users = getAllUsers();
  const normalized = username.trim().toLowerCase();
  return users.find(u => u.username.toLowerCase() === normalized) || null;
}

export function findUserById(id: string): UserRecord | null {
  const users = getAllUsers();
  return users.find(u => u.id === id) || memoryUsers.get(id) || null;
}

export function registerUser(data: { username: string; name: string; password: string }): {
  success: boolean;
  user?: { id: string; username: string; name: string };
  error?: string;
} {
  ensureStore();
  const username = data.username.trim().toLowerCase();
  const name = data.name.trim();

  if (!username || username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!name) {
    return { success: false, error: 'Please enter your full name.' };
  }
  if (!data.password || data.password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const existing = findUserByUsername(username);
  if (existing) {
    return { success: false, error: 'Username is already registered. Please choose another or log in.' };
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(data.password, salt);
  const now = new Date().toISOString();

  const newRecord: UserRecord = {
    id: userId,
    username,
    name,
    passwordHash,
    salt,
    createdAt: now,
  };

  // 1. Update memory
  memoryUsers.set(userId, newRecord);

  const initialUserData: UserDataFile = {
    user: {
      id: userId,
      username,
      name,
      createdAt: now,
    },
    accounts: [],
    posts: [],
    autoReplyRules: [],
  };
  memoryUserData.set(userId, initialUserData);

  // 2. Persist to disk
  try {
    const users = Array.from(memoryUsers.values());
    fs.writeFileSync(getUsersIndexFile(), JSON.stringify(users, null, 2), 'utf-8');

    const userFilePath = path.join(getUsersDir(), `${userId}.json`);
    fs.writeFileSync(userFilePath, JSON.stringify(initialUserData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[UserStore] Persisting user to disk note:', err);
  }

  return {
    success: true,
    user: { id: userId, username, name },
  };
}

export function authenticateUser(username: string, password: string): {
  success: boolean;
  user?: { id: string; username: string; name: string };
  error?: string;
} {
  ensureStore();
  const user = findUserByUsername(username);
  if (!user) {
    return { success: false, error: 'User not found. Please register first.' };
  }

  const inputHash = hashPassword(password, user.salt);
  if (inputHash !== user.passwordHash) {
    return { success: false, error: 'Incorrect password. Please check and try again.' };
  }

  return {
    success: true,
    user: { id: user.id, username: user.username, name: user.name },
  };
}

export function getUserFilePath(userId: string): string {
  return path.join(getUsersDir(), `${userId}.json`);
}

export function getUserData(userId: string): UserDataFile | null {
  ensureStore();
  const filePath = getUserFilePath(userId);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryUserData.set(userId, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn(`[UserStore] Read file fallback to memory for ${userId}:`, err);
  }

  if (memoryUserData.has(userId)) {
    return memoryUserData.get(userId)!;
  }

  const userRecord = findUserById(userId);
  if (!userRecord) return null;

  const defaultData: UserDataFile = {
    user: {
      id: userRecord.id,
      username: userRecord.username,
      name: userRecord.name,
      createdAt: userRecord.createdAt,
    },
    accounts: [],
    posts: [],
    autoReplyRules: [],
  };

  memoryUserData.set(userId, defaultData);
  try {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  } catch {}
  return defaultData;
}

export function saveUserData(userId: string, data: UserDataFile) {
  ensureStore();
  memoryUserData.set(userId, data);
  try {
    const filePath = getUserFilePath(userId);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[UserStore] Save file warning for ${userId}:`, err);
  }
}

export function addAccountToUser(userId: string, account: Account): boolean {
  const data = getUserData(userId);
  if (!data) return false;

  const existingIdx = data.accounts.findIndex(
    a => a.id === account.id || (a.platform === account.platform && a.clientName === account.clientName)
  );

  if (existingIdx >= 0) {
    data.accounts[existingIdx] = account;
  } else {
    data.accounts.unshift(account);
  }

  saveUserData(userId, data);
  return true;
}

export function removeAccountFromUser(userId: string, accountId: string): boolean {
  const data = getUserData(userId);
  if (!data) return false;

  data.accounts = data.accounts.filter(a => a.id !== accountId);
  saveUserData(userId, data);
  return true;
}
