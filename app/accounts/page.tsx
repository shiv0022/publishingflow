'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PlatformBadge } from '@/components/PlatformBadge';
import { Platform, ConnectionStatus, ConnectionType } from '@/types';
import {
  Plus, Trash2, ShieldCheck, RefreshCw, Link2,
  AlertCircle, CheckCircle, ExternalLink, KeyRound, X, Check
} from 'lucide-react';
import { InstagramIcon, FacebookIcon, YouTubeIcon } from '@/components/PlatformIcons';

const ALL_PLATFORMS: { id: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Instagram', label: 'Instagram', icon: <InstagramIcon size={15} />, color: 'Instagram' },
  { id: 'Facebook', label: 'Facebook', icon: <FacebookIcon size={15} />, color: 'Facebook' },
  { id: 'YouTube', label: 'YouTube', icon: <YouTubeIcon size={15} />, color: 'YouTube' },
];

const CONNECTION_TYPES: { type: ConnectionType; label: string; desc: string }[] = [
  { type: 'manual', label: 'Manual', desc: 'Copy caption, download media, mark posted manually.' },
  { type: 'mock', label: 'Mock / Test', desc: 'Simulated API connection for testing workflows.' },
  { type: 'oauth', label: 'Meta / Google', desc: 'Real OAuth login with Meta or Google. Requires API keys.' },
];

function AccountsContent() {
  const searchParams = useSearchParams();
  const { accounts, addAccount, updateAccount, deleteAccount } = useApp();

  const [oauthStatus, setOauthStatus] = useState<{ instagram: boolean; facebook: boolean; youtube: boolean }>({ instagram: false, facebook: false, youtube: false });
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [clientName, setClientName] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set(['Instagram']));
  const [connectionType, setConnectionType] = useState<ConnectionType>('oauth');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Connected');

  useEffect(() => {
    fetch('/api/oauth/status')
      .then((res) => res.json())
      .then((data) => { if (data?.configured) setOauthStatus(data.configured); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const connectedParam = searchParams.get('connected');
    const platformParam = searchParams.get('platform');
    if (errorParam === 'oauth_not_configured') {
      setBannerMessage({ type: 'error', text: `OAuth not configured for ${platformParam || 'this platform'}.` });
    } else if (connectedParam === 'true') {
      setBannerMessage({ type: 'success', text: `Successfully connected ${platformParam || 'account'} via Meta OAuth!` });
    }
  }, [searchParams]);

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev => {
      const n = new Set(prev);
      if (n.has(p)) { if (n.size > 1) n.delete(p); }
      else n.add(p);
      return n;
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { alert('Please enter a client name'); return; }
    const initialStatus = connectionType === 'oauth' ? 'Pending' : connectionStatus;
    for (const p of Array.from(selectedPlatforms)) {
      await addAccount({ clientName: clientName.trim(), platform: p, connectionType, connectionStatus: initialStatus });
    }
    setClientName('');
    setSelectedPlatforms(new Set(['Instagram']));
    setShowAddForm(false);
  };

  const cycleStatus = async (id: string, current: ConnectionStatus) => {
    const map: Record<ConnectionStatus, ConnectionStatus> = { Connected: 'Disconnected', Disconnected: 'Pending', Pending: 'Connected' };
    await updateAccount(id, { connectionStatus: map[current] });
  };

  const isPlatformOAuthConfigured = (p: Platform) => Boolean(oauthStatus[p.toLowerCase() as keyof typeof oauthStatus]);

  // Group accounts by clientName
  const clientGroups = accounts.reduce<Record<string, typeof accounts>>((acc, a) => {
    if (!acc[a.clientName]) acc[a.clientName] = [];
    acc[a.clientName].push(a);
    return acc;
  }, {});

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Manage client social media accounts and platform connections.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          <Plus size={16} />
          <span>{showAddForm ? 'Cancel' : 'Add Account'}</span>
        </button>
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

      {/* 1-Click Connect Cards (Meta & YouTube) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Meta (Facebook + Instagram) */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.06) 100%)',
          border: '1.5px solid rgba(99,102,241,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1877f2, #e1306c)',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(225, 48, 108, 0.25)',
            }}>
              <Link2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                Connect Meta (FB & Instagram)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                1-Click link for Facebook Pages and Instagram accounts.
              </p>
            </div>
          </div>

          <a
            href="/api/oauth/facebook"
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '0.45rem',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
            }}
          >
            <Link2 size={14} />
            <span>Connect Meta</span>
          </a>
        </div>

        {/* YouTube Channel */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(220,38,38,0.04) 100%)',
          border: '1.5px solid rgba(239,68,68,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#ff0000',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(255, 0, 0, 0.25)',
            }}>
              <YouTubeIcon size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                Connect YouTube Channel
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Link your Google account to auto-publish videos to YouTube.
              </p>
            </div>
          </div>

          <a
            href="/api/oauth/youtube"
            className="btn btn-primary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '0.45rem',
              background: '#ff0000',
              border: 'none',
              boxShadow: '0 2px 8px rgba(239,68,68,0.25)',
            }}
          >
            <Link2 size={14} />
            <span>Connect YouTube</span>
          </a>
        </div>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.75rem', borderColor: 'rgba(99,102,241,0.3)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
            Add New Client Account
          </h2>
          <form onSubmit={handleAddSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input type="text" placeholder="e.g. Rachit Chauhan" className="form-input" value={clientName}
                  onChange={(e) => setClientName(e.target.value)} autoFocus required />
              </div>

              <div className="form-group">
                <label className="form-label">Connection Type</label>
                <select className="form-select" value={connectionType} onChange={(e) => setConnectionType(e.target.value as ConnectionType)}>
                  {CONNECTION_TYPES.map((ct) => (
                    <option key={ct.type} value={ct.type}>{ct.label}</option>
                  ))}
                </select>
                <p className="form-helper">{CONNECTION_TYPES.find((c) => c.type === connectionType)?.desc}</p>
              </div>

              {connectionType !== 'oauth' && (
                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select className="form-select" value={connectionStatus} onChange={(e) => setConnectionStatus(e.target.value as ConnectionStatus)}>
                    {(['Connected', 'Disconnected', 'Pending'] as ConnectionStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Platform Selection */}
            <div className="form-group">
              <label className="form-label">Select Platforms</label>
              <div className="platform-checkbox-grid">
                {ALL_PLATFORMS.map(p => {
                  const configured = isPlatformOAuthConfigured(p.id);
                  const isChecked = selectedPlatforms.has(p.id);
                  return (
                    <label key={p.id} className={`platform-checkbox-item ${isChecked ? `checked-${p.id}` : ''} ${connectionType === 'oauth' && !configured ? 'disabled' : ''}`}
                      onClick={() => connectionType !== 'oauth' || configured ? togglePlatform(p.id) : undefined}
                      style={{ cursor: connectionType === 'oauth' && !configured ? 'not-allowed' : 'pointer' }}>
                      <input type="checkbox" checked={isChecked} readOnly />
                      {p.icon}
                      <span>{p.label}</span>
                      {isChecked && <Check size={13} style={{ marginLeft: 'auto' }} />}
                      {connectionType === 'oauth' && !configured && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--danger)', marginLeft: '4px' }}>No key</span>
                      )}
                    </label>
                  );
                })}
              </div>
              <p className="form-helper">One account row is created per selected platform.</p>
            </div>

            {connectionType === 'oauth' && (
              <div style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 'var(--radius)',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <KeyRound size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span>After saving, click <strong style={{ color: 'var(--text-main)' }}>Connect</strong> next to each platform to authorize via Meta / Google OAuth.</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary">
                <Check size={15} /> Save Account{selectedPlatforms.size > 1 ? `s (${selectedPlatforms.size})` : ''}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List — Grouped by Client */}
      {Object.keys(clientGroups).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><ShieldCheck size={32} /></div>
          <h3 className="empty-title">No accounts added yet</h3>
          <p className="empty-desc">Add your first client account to start creating and scheduling posts across platforms.</p>
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <Plus size={15} /> Add First Account
          </button>
        </div>
      ) : (
        <div>
          {Object.entries(clientGroups).map(([name, accs]) => (
            <div key={name} className="client-group">
              <div className="client-group-header">
                <span className="client-group-name">{name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {accs.length} platform{accs.length !== 1 ? 's' : ''}
                </span>
              </div>
              {accs.map((acc) => {
                const oauthConfigured = isPlatformOAuthConfigured(acc.platform);
                return (
                  <div key={acc.id} className="platform-row">
                    {/* Platform */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '130px' }}>
                      <PlatformBadge platform={acc.platform} />
                    </div>

                    {/* Type Badge */}
                    <span className={`type-badge ${acc.connectionType === 'oauth' ? 'meta' : acc.connectionType}`}>
                      {acc.connectionType === 'oauth' ? 'Meta' : acc.connectionType}
                    </span>

                    {/* Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {acc.connectionType === 'oauth' && !oauthConfigured ? (
                        <span className="badge-not-configured">
                          <AlertCircle size={11} /><span>Not Configured</span>
                        </span>
                      ) : (
                        <span
                          className={`conn-badge ${acc.connectionStatus}`}
                          onClick={() => { if (acc.connectionType === 'manual') cycleStatus(acc.id, acc.connectionStatus); }}
                          title={acc.connectionType === 'manual' ? 'Click to cycle status' : 'Connection status'}
                        >
                          {acc.connectionStatus === 'Connected' && '●'}
                          {acc.connectionStatus === 'Disconnected' && '○'}
                          {acc.connectionStatus === 'Pending' && '◐'}
                          {' '}{acc.connectionStatus}
                        </span>
                      )}

                      {/* OAuth Connect Button */}
                      {acc.connectionType === 'oauth' && oauthConfigured && (
                        <a
                          href={`/api/oauth/${acc.platform.toLowerCase()}?accountId=${encodeURIComponent(acc.id)}`}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', gap: '0.35rem' }}
                        >
                          <Link2 size={12} />
                          <span>{acc.connectionStatus === 'Connected' ? 'Re-link' : 'Connect'}</span>
                        </a>
                      )}
                    </div>

                    {/* Delete */}
                    <button onClick={() => deleteAccount(acc.id)} className="btn-danger-outline" title="Delete account"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Trash2 size={13} /><span>Delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="main-content"><p style={{ color: 'var(--text-muted)' }}>Loading accounts...</p></div>}>
      <AccountsContent />
    </Suspense>
  );
}
