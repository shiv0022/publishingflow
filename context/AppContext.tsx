'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, Post, PostStatus, ConnectionStatus, ConnectionType, Platform, AutoReplyRule } from '@/types';
import {
  supabase,
  isSupabaseConfigured,
  mapAccountFromDb,
  mapAccountToDb,
  mapPostFromDb,
  mapPostToDb
} from '@/lib/supabase';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UserProfile {
  name: string;
  loggedIn: boolean;
}

interface AppContextType {
  user: UserProfile;
  login: (name: string) => void;
  logout: () => void;
  accounts: Account[];
  posts: Post[];
  autoReplyRules: AutoReplyRule[];
  isLoaded: boolean;
  isUsingSupabase: boolean;
  addAccount: (data: {
    clientName: string;
    platform: Platform;
    connectionType: ConnectionType;
    connectionStatus: ConnectionStatus;
    oauthAccountId?: string;
  }) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addPost: (data: Omit<Post, 'id' | 'createdAt'>) => Promise<Post>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  updatePostStatus: (id: string, status: PostStatus, publishedAt?: string) => Promise<void>;
  addAutoReplyRule: (rule: Omit<AutoReplyRule, 'id' | 'createdAt' | 'triggerCount'>) => Promise<AutoReplyRule>;
  toggleAutoReplyRule: (id: string) => Promise<void>;
  deleteAutoReplyRule: (id: string) => Promise<void>;
  incrementRuleTriggerCount: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  triggerSchedulerWorker: () => Promise<{ success: boolean; message: string; processedCount: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'pf_user';
const ACCOUNTS_STORAGE_KEY = 'pf_accounts';
const POSTS_STORAGE_KEY = 'pf_posts';
const AUTO_REPLY_STORAGE_KEY = 'pf_autoreply_rules';

const DEFAULT_RULES: AutoReplyRule[] = [
  {
    id: 'rule-1',
    platform: 'Instagram',
    keyword: 'LINK',
    dmMessage: 'Hey there! 👋 Here is the link you requested from our Reel: https://example.com/special-access\n\nEnjoy, and feel free to ask any questions!',
    commentReply: 'Sent to your DM! Check your requests/inbox 📩',
    isActive: true,
    triggerCount: 47,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rule-2',
    platform: 'Facebook',
    keyword: 'PRICE',
    dmMessage: 'Hello! Thanks for reaching out. Our complete price breakdown and package details are right here: https://example.com/pricing 🚀',
    commentReply: 'Check your Messenger! Details sent 💬',
    isActive: true,
    triggerCount: 23,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>({ name: '', loggedIn: false });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [autoReplyRules, setAutoReplyRules] = useState<AutoReplyRule[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  const login = useCallback((name: string) => {
    const profile = { name: name.trim(), loggedIn: true };
    setUser(profile);
    try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile)); } catch {}
  }, []);

  const logout = useCallback(() => {
    setUser({ name: '', loggedIn: false });
    try { localStorage.removeItem(USER_STORAGE_KEY); } catch {}
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.loggedIn && parsed?.name) {
          setUser(parsed);
        }
      }
    } catch {}
  }, []);

  const persistLocalStorage = useCallback((accs: Account[], psts: Post[], rules?: AutoReplyRule[]) => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accs));
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(psts));
      if (rules) {
        localStorage.setItem(AUTO_REPLY_STORAGE_KEY, JSON.stringify(rules));
      }
    } catch {}
  }, []);

  const refreshData = useCallback(async () => {
    // Load Auto Reply Rules from storage
    try {
      const savedRules = localStorage.getItem(AUTO_REPLY_STORAGE_KEY);
      if (savedRules) {
        setAutoReplyRules(JSON.parse(savedRules));
      } else {
        setAutoReplyRules(DEFAULT_RULES);
        localStorage.setItem(AUTO_REPLY_STORAGE_KEY, JSON.stringify(DEFAULT_RULES));
      }
    } catch {
      setAutoReplyRules(DEFAULT_RULES);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!accountsError && !postsError) {
          setIsUsingSupabase(true);
          const loadedAccounts = (accountsData || []).map(mapAccountFromDb);
          const loadedPosts = (postsData || []).map(mapPostFromDb);
          setAccounts(loadedAccounts);
          setPosts(loadedPosts);
          persistLocalStorage(loadedAccounts, loadedPosts);
          setIsLoaded(true);
          return;
        }
      } catch (err) {
        console.warn('Supabase fetch error, fallback to cache:', err);
      }
    }

    // Fallback to localStorage
    try {
      const savedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const savedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
      setAccounts(savedAccounts ? JSON.parse(savedAccounts) : []);
      setPosts(savedPosts ? JSON.parse(savedPosts) : []);
    } catch {} finally {
      setIsLoaded(true);
    }
  }, [persistLocalStorage]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // Background scheduler (every 30s)
  useEffect(() => {
    const runWorker = async () => {
      try {
        const res = await fetch('/api/cron/publish-scheduled');
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            await refreshData();
          }
        }
      } catch {}
    };
    const initialTimer = setTimeout(runWorker, 5000);
    const interval = setInterval(runWorker, 30000);
    return () => { clearTimeout(initialTimer); clearInterval(interval); };
  }, [refreshData]);

  const triggerSchedulerWorker = useCallback(async () => {
    try {
      const res = await fetch('/api/cron/publish-scheduled', { method: 'POST' });
      const data = await res.json();
      if (data.results && data.results.length > 0) await refreshData();
      return { success: res.ok, message: data.message || 'Done.', processedCount: data.processedCount || 0 };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed.', processedCount: 0 };
    }
  }, [refreshData]);

  const addAccount = async (data: {
    clientName: string;
    platform: Platform;
    connectionType: ConnectionType;
    connectionStatus: ConnectionStatus;
    oauthAccountId?: string;
  }) => {
    const now = new Date().toISOString();
    const newAccount: Account = {
      id: generateUUID(),
      clientName: data.clientName.trim(),
      platform: data.platform,
      connectionType: data.connectionType,
      connectionStatus: data.connectionStatus,
      oauthAccountId: data.oauthAccountId,
      createdAt: now,
      updatedAt: now,
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('accounts').insert(mapAccountToDb(newAccount));
      if (error) throw error;
    }
    const updated = [newAccount, ...accounts];
    setAccounts(updated);
    persistLocalStorage(updated, posts);
    return newAccount;
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const payload: any = { updated_at: now };
      if (updates.clientName !== undefined) payload.client_name = updates.clientName;
      if (updates.platform !== undefined) payload.platform = updates.platform;
      if (updates.connectionType !== undefined) payload.connection_type = updates.connectionType;
      if (updates.connectionStatus !== undefined) payload.connection_status = updates.connectionStatus;
      if (updates.oauthAccountId !== undefined) payload.oauth_account_id = updates.oauthAccountId;
      const { error } = await supabase.from('accounts').update(payload).eq('id', id);
      if (error) throw error;
    }
    const updated = accounts.map((acc) => (acc.id === id ? { ...acc, ...updates, updatedAt: now } : acc));
    setAccounts(updated);
    persistLocalStorage(updated, posts);
  };

  const deleteAccount = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    }
    const updated = accounts.filter((acc) => acc.id !== id);
    setAccounts(updated);
    persistLocalStorage(updated, posts);
  };

  const addPost = async (data: Omit<Post, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newPost: Post = {
      ...data,
      id: generateUUID(),
      accountId: data.accountId || accounts.find(a => a.clientName === data.clientName)?.id,
      createdAt: now,
      updatedAt: now,
    };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('posts').insert(mapPostToDb(newPost));
      if (error) throw error;
    }
    const updated = [newPost, ...posts];
    setPosts(updated);
    persistLocalStorage(accounts, updated);
    return newPost;
  };

  const updatePost = async (id: string, updates: Partial<Post>) => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const payload: any = { updated_at: now };
      if (updates.accountId !== undefined) payload.account_id = updates.accountId;
      if (updates.clientName !== undefined) payload.client_name = updates.clientName;
      if (updates.platform !== undefined) payload.platform = updates.platform;
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.caption !== undefined) payload.caption = updates.caption;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.mediaUrl !== undefined) payload.media_url = updates.mediaUrl;
      if (updates.mediaType !== undefined) payload.media_type = updates.mediaType;
      if (updates.mediaName !== undefined) payload.media_name = updates.mediaName;
      if (updates.isScheduled !== undefined) payload.is_scheduled = updates.isScheduled;
      if (updates.scheduledAt !== undefined) payload.scheduled_at = updates.scheduledAt;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.publishedAt !== undefined) payload.published_at = updates.publishedAt;
      const { error } = await supabase.from('posts').update(payload).eq('id', id);
      if (error) throw error;
    }
    const updated = posts.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p));
    setPosts(updated);
    persistLocalStorage(accounts, updated);
  };

  const deletePost = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    }
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    persistLocalStorage(accounts, updated);
  };

  const updatePostStatus = async (id: string, status: PostStatus, publishedAt?: string) => {
    await updatePost(id, { status, ...(publishedAt ? { publishedAt } : {}) });
  };

  const addAutoReplyRule = async (ruleData: Omit<AutoReplyRule, 'id' | 'createdAt' | 'triggerCount'>) => {
    const newRule: AutoReplyRule = {
      ...ruleData,
      id: generateUUID(),
      triggerCount: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [newRule, ...autoReplyRules];
    setAutoReplyRules(updated);
    try {
      localStorage.setItem(AUTO_REPLY_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return newRule;
  };

  const toggleAutoReplyRule = async (id: string) => {
    const updated = autoReplyRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setAutoReplyRules(updated);
    try {
      localStorage.setItem(AUTO_REPLY_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const deleteAutoReplyRule = async (id: string) => {
    const updated = autoReplyRules.filter(r => r.id !== id);
    setAutoReplyRules(updated);
    try {
      localStorage.setItem(AUTO_REPLY_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const incrementRuleTriggerCount = async (id: string) => {
    const updated = autoReplyRules.map(r => r.id === id ? { ...r, triggerCount: (r.triggerCount || 0) + 1 } : r);
    setAutoReplyRules(updated);
    try {
      localStorage.setItem(AUTO_REPLY_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  return (
    <AppContext.Provider value={{
      user, login, logout,
      accounts, posts, autoReplyRules, isLoaded, isUsingSupabase,
      addAccount, updateAccount, deleteAccount,
      addPost, updatePost, deletePost, updatePostStatus,
      addAutoReplyRule, toggleAutoReplyRule, deleteAutoReplyRule, incrementRuleTriggerCount,
      refreshData, triggerSchedulerWorker,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
