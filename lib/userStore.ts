import fs from 'fs';
import path from 'path';
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

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const USERS_INDEX_FILE = path.join(DATA_DIR, 'users_index.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }

  // Pre-seed default user "rachit" with existing Meta connections if not already created
  if (!fs.existsSync(USERS_INDEX_FILE)) {
    const defaultSalt = crypto.randomBytes(16).toString('hex');
    const defaultHash = hashPassword('rachit123', defaultSalt);
    const initialUsers: UserRecord[] = [
      {
        id: 'usr_rachit',
        username: 'rachit',
        name: 'Rachit Chauhan',
        passwordHash: defaultHash,
        salt: defaultSalt,
        createdAt: new Date().toISOString(),
      },
    ];

    fs.writeFileSync(USERS_INDEX_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');

    // Pre-seed rachit's file with his existing connected Facebook and Instagram accounts
    const rachitFile: UserDataFile = {
      user: {
        id: 'usr_rachit',
        username: 'rachit',
        name: 'Rachit Chauhan',
        createdAt: new Date().toISOString(),
      },
      accounts: [
        {
          id: 'cea3568f-c386-466a-8eb4-9e23f7c1dfee',
          clientName: 'Recall X Marketing',
          platform: 'Facebook',
          connectionType: 'oauth',
          connectionStatus: 'Connected',
          oauthAccountId: '1277040138828478',
          createdAt: '2026-09-13T14:05:22.822Z',
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3a51236d-5f51-4663-86db-af37fcbd233d',
          clientName: 'th_rachit_chauhan',
          platform: 'Instagram',
          connectionType: 'oauth',
          connectionStatus: 'Connected',
          oauthAccountId: '17841426006285626',
          createdAt: '2026-09-13T14:05:23.900Z',
          updatedAt: new Date().toISOString(),
        },
      ],
      posts: [],
      autoReplyRules: [
        {
          id: 'rule-ig-link',
          platform: 'Instagram',
          keyword: 'LINK',
          dmMessage: 'Hey! 👋 Here is your link from our Reel. Enjoy!',
          commentReply: 'Check your DM! Sent 📩',
          isActive: true,
          triggerCount: 12,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rule-fb-price',
          platform: 'Facebook',
          keyword: 'PRICE',
          dmMessage: 'Hello! Complete pricing details are sent via Messenger.',
          commentReply: 'Details sent in Messenger! 💬',
          isActive: true,
          triggerCount: 5,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    fs.writeFileSync(
      path.join(USERS_DIR, 'usr_rachit.json'),
      JSON.stringify(rachitFile, null, 2),
      'utf-8'
    );
  }
}

export function getAllUsers(): UserRecord[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(USERS_INDEX_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[UserStore] Error reading users index:', err);
    return [];
  }
}

export function findUserByUsername(username: string): UserRecord | null {
  const users = getAllUsers();
  const normalized = username.trim().toLowerCase();
  return users.find(u => u.username.toLowerCase() === normalized) || null;
}

export function findUserById(id: string): UserRecord | null {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
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

  const users = getAllUsers();
  users.push(newRecord);
  fs.writeFileSync(USERS_INDEX_FILE, JSON.stringify(users, null, 2), 'utf-8');

  // Create isolated user data file with EMPTY accounts
  const initialUserData: UserDataFile = {
    user: {
      id: userId,
      username,
      name,
      createdAt: now,
    },
    accounts: [], // Strictly 0 accounts for new user!
    posts: [],
    autoReplyRules: [],
  };

  const userFilePath = path.join(USERS_DIR, `${userId}.json`);
  fs.writeFileSync(userFilePath, JSON.stringify(initialUserData, null, 2), 'utf-8');

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
  return path.join(USERS_DIR, `${userId}.json`);
}

export function getUserData(userId: string): UserDataFile | null {
  ensureStore();
  const filePath = getUserFilePath(userId);
  if (!fs.existsSync(filePath)) {
    const userRecord = findUserById(userId);
    if (!userRecord) return null;

    // Create file if missing
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
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[UserStore] Failed to read data for ${userId}:`, err);
    return null;
  }
}

export function saveUserData(userId: string, data: UserDataFile) {
  ensureStore();
  const filePath = getUserFilePath(userId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function addAccountToUser(userId: string, account: Account): boolean {
  const data = getUserData(userId);
  if (!data) return false;

  // Filter out any existing account with same platform or same id
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
