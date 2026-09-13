'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Share2, ArrowRight } from 'lucide-react';
import { FacebookFilledIcon } from '@/components/PlatformIcons';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isLoaded, accounts } = useApp();
  const [name, setName] = useState('');

  useEffect(() => {
    if (isLoaded && user.loggedIn) {
      const hasAccounts = accounts.some(a => a.connectionStatus === 'Connected');
      router.replace(hasAccounts ? '/upload' : '/profile');
    }
  }, [isLoaded, user.loggedIn, accounts, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    login(name.trim());
    const hasAccounts = accounts.some(a => a.connectionStatus === 'Connected');
    router.push(hasAccounts ? '/upload' : '/profile');
  };

  if (!isLoaded || user.loggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <div className="spinner" /> Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: '#f4f6fb'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '14px',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
        }}>
          <Share2 size={26} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          PublishingFlow
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.35rem', marginBottom: '1.75rem' }}>
          Publish to Facebook &amp; Instagram in one click
        </p>

        {/* 1-Click Meta OAuth Login */}
        <a
          href="/api/oauth/facebook"
          className="btn btn-full btn-lg"
          style={{
            background: '#1877f2',
            color: '#fff',
            padding: '0.85rem 1rem',
            fontSize: '0.98rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(24, 119, 242, 0.25)'
          }}
        >
          <FacebookFilledIcon size={20} />
          <span>Continue with Meta (Facebook)</span>
        </a>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '1.5rem 0',
          color: 'var(--text-dim)',
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span>or test with name</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Enter your name to test"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ textAlign: 'center', fontSize: '0.92rem', padding: '0.75rem' }}
          />

          <button
            type="submit"
            className="btn btn-secondary btn-full"
            disabled={!name.trim()}
            style={{ padding: '0.7rem' }}
          >
            <span>Quick Login</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
