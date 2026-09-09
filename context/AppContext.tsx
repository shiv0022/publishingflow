'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, Post, PostStatus, ConnectionStatus, ConnectionType, Platform } from '@/types';
import { initialAccounts, initialPosts } from '@/lib/dummyData';
import { 
  supabase, 
  isSupabaseConfigured, 
  mapAccountFromDb, 
  mapAccountToDb, 
  mapPostFromDb, 
  mapPostToDb 
} from '@/lib/supabase';

// Helper to generate standard RFC 4122 UUIDs
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

interface AppContextType {
  accounts: Account[];
  posts: Post[];
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
  resetToDummyData: () => Promise<void>;
  refreshData: () => Promise<void>;
  triggerSchedulerWorker: () => Promise<{ success: boolean; message: string; processedCount: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEMO_CLIENT_NAMES = [
  'Apex Fitness Studio',
  'Blue Harbor Bistro',
  'TechCraft Academy',
  'Zenith Real Estate',
  'Horizon Creative Labs',
];

const ACCOUNTS_STORAGE_KEY = 'publishingflow_accounts_v7_clean';
const POSTS_STORAGE_KEY = 'publishingflow_posts_v7_clean';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // LocalStorage helper for offline/fallback mode
  const persistLocalStorage = useCallback((accs: Account[], psts: Post[]) => {
    try {
      const cleanAccs = accs.filter(a => !DEMO_CLIENT_NAMES.includes(a.clientName));
      const cleanPosts = psts.filter(p => !DEMO_CLIENT_NAMES.includes(p.clientName));
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(cleanAccs));
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(cleanPosts));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  }, []);

  // 1. REFRESH DATA FROM SUPABASE OR LOCALSTORAGE
  const refreshData = useCallback(async () => {
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
          const loadedAccounts = (accountsData || [])
            .map(mapAccountFromDb)
            .filter((a) => !DEMO_CLIENT_NAMES.includes(a.clientName));
          const loadedPosts = (postsData || [])
            .map(mapPostFromDb)
            .filter((p) => !DEMO_CLIENT_NAMES.includes(p.clientName));

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

    // Fallback
    try {
      const savedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      const savedPosts = localStorage.getItem(POSTS_STORAGE_KEY);

      const parsedAccs = savedAccounts ? JSON.parse(savedAccounts) : [];
      const parsedPosts = savedPosts ? JSON.parse(savedPosts) : [];

      const cleanAccs = (Array.isArray(parsedAccs) ? parsedAccs : [])
        .filter((a: any) => !DEMO_CLIENT_NAMES.includes(a.clientName));
      const cleanPosts = (Array.isArray(parsedPosts) ? parsedPosts : [])
        .filter((p: any) => !DEMO_CLIENT_NAMES.includes(p.clientName));

      setAccounts(cleanAccs);
      setPosts(cleanPosts);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(cleanAccs));
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(cleanPosts));
    } catch (e) {
      console.error('Error reading localStorage fallback:', e);
    } finally {
      setIsLoaded(true);
    }
  }, [persistLocalStorage]);

  // Load on mount and wipe legacy demo keys
  useEffect(() => {
    try {
      localStorage.removeItem('publishingflow_accounts_v5');
      localStorage.removeItem('publishingflow_posts_v5');
      localStorage.removeItem('publishingflow_accounts_v6');
      localStorage.removeItem('publishingflow_posts_v6');
    } catch {}
    fetch('/api/cleanup-demo', { method: 'POST' }).catch(() => {});
    refreshData();
  }, [refreshData]);

  // Trigger scheduler API call
  const triggerSchedulerWorker = useCallback(async () => {
    try {
      const res = await fetch('/api/cron/publish-scheduled', { method: 'POST' });
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        await refreshData();
      }
      return {
        success: res.ok,
        message: data.message || 'Scheduler executed successfully.',
        processedCount: data.processedCount || 0,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Scheduler request failed.',
        processedCount: 0,
      };
    }
  }, [refreshData]);

  // Global background runner (runs every 30s across any active tab)
  useEffect(() => {
    const runWorker = async () => {
      try {
        const res = await fetch('/api/cron/publish-scheduled');
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            console.log('[Scheduler Worker]: Processed due posts:', data.results);
            await refreshData();
          }
        }
      } catch (e) {
        // Safe background check catch
      }
    };

    // Run 5s after mount then every 30s
    const initialTimer = setTimeout(runWorker, 5000);
    const interval = setInterval(runWorker, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [refreshData]);

  // 2. ADD ACCOUNT (SUPABASE INSERT)
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
      if (error) {
        console.error('Supabase error inserting account:', error);
        alert('Supabase Error: ' + error.message);
        throw error;
      }
    }

    const updated = [newAccount, ...accounts];
    setAccounts(updated);
    persistLocalStorage(updated, posts);
    return newAccount;
  };

  // 3. UPDATE ACCOUNT (SUPABASE UPDATE)
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
      if (error) {
        console.error('Supabase error updating account:', error);
        alert('Supabase Error: ' + error.message);
        throw error;
      }
    }

    const updated = accounts.map((acc) => (acc.id === id ? { ...acc, ...updates, updatedAt: now } : acc));
    setAccounts(updated);
    persistLocalStorage(updated, posts);
  };

  // 4. DELETE ACCOUNT (SUPABASE DELETE)
  const deleteAccount = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) {
        console.error('Supabase error deleting account:', error);
        alert('Supabase Error: ' + error.message);
        throw error;
      }
    }

    const updated = accounts.filter((acc) => acc.id !== id);
    setAccounts(updated);
    persistLocalStorage(updated, posts);
  };

  // 5. CREATE POST (SUPABASE INSERT)
  const addPost = async (data: Omit<Post, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const matchedAccount = accounts.find((a) => a.clientName === data.clientName);

    const newPost: Post = {
      ...data,
      id: generateUUID(),
      accountId: data.accountId || matchedAccount?.id,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('posts').insert(mapPostToDb(newPost));
      if (error) {
        console.error('Supabase error inserting post:', error);
        alert('Supabase Error: ' + error.message);
        throw error;
      }
    }

    const updated = [newPost, ...posts];
    setPosts(updated);
    persistLocalStorage(accounts, updated);
    return newPost;
  };

  // 6. UPDATE POST & STATUS (SUPABASE UPDATE)
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
      if (error) {
        console.error('Supabase error updating post:', error);
        alert('Supabase Error: ' + error.message);
        throw error;
      }
    }

    const updated = posts.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p));
    setPosts(updated);
    persistLocalStorage(accounts, updated);
  };

  // 7. DELETE POST (SUPABASE DELETE)
  const deletePost = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) {
        console.error('Supabase error deleting post:', error);
        alert('Supabase Error: ' + error.message);
        throw error;
      }
    }

    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    persistLocalStorage(accounts, updated);
  };

  // 8. UPDATE STATUS CONVENIENCE METHOD
  const updatePostStatus = async (id: string, status: PostStatus, publishedAt?: string) => {
    await updatePost(id, { 
      status, 
      ...(publishedAt ? { publishedAt } : {}) 
    });
  };

  // Permanent Clean / Reset to Empty
  const resetToDummyData = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.error('Supabase reset error:', err);
      }
    }

    setAccounts([]);
    setPosts([]);
    persistLocalStorage([], []);
  };

  return (
    <AppContext.Provider
      value={{
        accounts,
        posts,
        isLoaded,
        isUsingSupabase,
        addAccount,
        updateAccount,
        deleteAccount,
        addPost,
        updatePost,
        deletePost,
        updatePostStatus,
        resetToDummyData,
        refreshData,
        triggerSchedulerWorker,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
