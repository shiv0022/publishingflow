'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, Users, Activity, RotateCcw, Share2, Database, HardDrive } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function Navbar() {
  const pathname = usePathname();
  const { posts, accounts, resetToDummyData, isUsingSupabase } = useApp();

  const handleReset = async () => {
    if (window.confirm('Reset all posts and accounts to default demo data?')) {
      await resetToDummyData();
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link href="/create" className="brand">
          <div className="brand-icon">
            <Share2 size={16} strokeWidth={2.5} />
          </div>
          <span>PublishingFlow</span>
        </Link>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <Link
            href="/create"
            className={`nav-link ${pathname === '/' || pathname === '/create' ? 'active' : ''}`}
          >
            <Send size={15} />
            <span>Create Post</span>
          </Link>
          <Link
            href="/status"
            className={`nav-link ${pathname === '/status' ? 'active' : ''}`}
          >
            <Activity size={15} />
            <span>Status ({posts.length})</span>
          </Link>
          <Link
            href="/accounts"
            className={`nav-link ${pathname === '/accounts' ? 'active' : ''}`}
          >
            <Users size={15} />
            <span>Accounts ({accounts.length})</span>
          </Link>
        </nav>

        {/* Actions & Storage Mode Indicator */}
        <div className="nav-actions">
          {isUsingSupabase ? (
            <span 
              className="badge-mode" 
              style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}
              title="Supabase connected: Saving to Supabase PostgreSQL"
            >
              <Database size={12} color="#059669" />
              <span>Supabase Connected</span>
            </span>
          ) : (
            <span 
              className="badge-mode" 
              style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}
              title="Local Fallback: Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to connect Supabase"
            >
              <HardDrive size={12} color="#64748b" />
              <span>Local Storage Fallback</span>
            </span>
          )}

          <button
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            title="Reset demo data"
          >
            <RotateCcw size={13} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
