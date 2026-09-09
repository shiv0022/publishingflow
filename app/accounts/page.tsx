'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PlatformBadge } from '@/components/PlatformBadge';
import { Platform } from '@/types';
import {
  Trash2, ShieldCheck, Link2, AlertCircle, CheckCircle, 
  ExternalLink, X, Check, RefreshCw
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, YouTubeIcon } from '@/components/PlatformIcons';

function AccountsContent() {
  const searchParams = useSearchParams();
  const { accounts, deleteAccount } = useApp();

  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const connectedParam = searchParams.get('connected');
    const platformParam = searchParams.get('platform');
    const messageParam = searchParams.get('message');

    if (errorParam === 'oauth_not_configured') {
      setBannerMessage({ 
        type: 'error', 
        text: `OAuth configuration missing for ${platformParam || 'this platform'}. Please check your client credentials.` 
      });
    } else if (errorParam === 'oauth_exchange_failed') {
      setBannerMessage({ 
        type: 'error', 
        text: `Authentication failed: ${messageParam || 'Could not complete login with provider.'}` 
      });
    } else if (connectedParam === 'true') {
      setBannerMessage({ 
        type: 'success', 
        text: `Successfully connected ${platformParam || 'account'}!` 
      });
    }
  }, [searchParams]);

  // Connected accounts
  const isMetaConnected = accounts.some(a => a.platform === 'Facebook' || a.platform === 'Instagram');
  const isYouTubeConnected = accounts.some(a => a.platform === 'YouTube');

  return (
    <div className="main-content" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Connected Social Channels</h1>
          <p className="page-subtitle">
            Connect your official social accounts in 1-click. PublishingFlow automatically publishes your content via verified APIs.
          </p>
        </div>
      </div>

      {/* Banner */}
      {bannerMessage && (
        <div style={{
          background: bannerMessage.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
          border: `1px solid ${bannerMessage.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
          color: bannerMessage.type === 'error' ? 'var(--danger)' : 'var(--success)',
          borderRadius: 'var(--radius)',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {bannerMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{bannerMessage.text}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1-Click Connect Hero Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Meta (Facebook & Instagram) */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)',
          border: '1.5px solid rgba(99,102,241,0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#1877f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 10px rgba(24,119,242,0.3)'
                }}>
                  <FacebookIcon size={20} />
                </div>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 10px rgba(225,48,108,0.3)'
                }}>
                  <InstagramIcon size={20} />
                </div>
              </div>

              {isMetaConnected ? (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--success)',
                  background: 'var(--success-light)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                  Connected
                </span>
              ) : (
                <span style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  background: 'var(--bg-subtle)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                }}>
                  Not Connected
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Meta (Facebook & Instagram)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              One single login connects your Facebook Pages and linked Instagram Business accounts.
            </p>
          </div>

          <a
            href="/api/oauth/facebook"
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              border: 'none',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
          >
            <Link2 size={16} />
            <span>{isMetaConnected ? 'Re-link Meta Account' : 'Connect Facebook + Instagram'}</span>
          </a>
        </div>

        {/* YouTube Channel */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(220,38,38,0.04) 100%)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ff0000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 10px rgba(255,0,0,0.3)'
              }}>
                <YouTubeIcon size={22} />
              </div>

              {isYouTubeConnected ? (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--success)',
                  background: 'var(--success-light)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                  Connected
                </span>
              ) : (
                <span style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  background: 'var(--bg-subtle)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                }}>
                  Not Connected
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              YouTube Channel
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              Link your Google Account to automatically upload long videos and YouTube Shorts directly.
            </p>
          </div>

          <a
            href="/api/oauth/youtube"
            className="btn btn-primary"
            style={{
              padding: '0.65rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              gap: '0.5rem',
              background: '#ff0000',
              border: 'none',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
            }}
          >
            <Link2 size={16} />
            <span>{isYouTubeConnected ? 'Re-link YouTube Channel' : 'Connect YouTube Channel'}</span>
          </a>
        </div>
      </div>

      {/* Connected Channels List */}
      <div style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
          Active Connected Channels ({accounts.length})
        </h2>

        {accounts.length === 0 ? (
          <div className="card empty-state" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div className="empty-icon" style={{ margin: '0 auto 0.75rem' }}>
              <ShieldCheck size={36} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No Channels Connected Yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              Click <strong>Connect Meta</strong> or <strong>Connect YouTube</strong> above to link your first official account in seconds.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Left: Avatar & Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: acc.platform === 'YouTube' ? '#fee2e2' : '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {acc.platform === 'YouTube' ? (
                      <YouTubeIcon size={20} />
                    ) : acc.platform === 'Instagram' ? (
                      <InstagramIcon size={20} />
                    ) : (
                      <FacebookIcon size={20} />
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {acc.clientName}
                      </span>
                      <PlatformBadge platform={acc.platform} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Connected via OAuth API
                    </span>
                  </div>
                </div>

                {/* Right: Status Pill & Disconnect Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--success)',
                    background: 'var(--success-light)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                    Active & Ready
                  </span>

                  <button
                    onClick={() => {
                      if (window.confirm(`Disconnect ${acc.clientName} (${acc.platform})?`)) {
                        deleteAccount(acc.id);
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', color: 'var(--danger)', gap: '0.3rem' }}
                    title="Disconnect this channel"
                  >
                    <Trash2 size={13} />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="main-content"><p style={{ color: 'var(--text-muted)' }}>Loading channels...</p></div>}>
      <AccountsContent />
    </Suspense>
  );
}
