'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PlatformBadge } from '@/components/PlatformBadge';
import { Platform, ConnectionStatus, ConnectionType } from '@/types';
import { 
  Plus, 
  Trash2, 
  ShieldCheck, 
  RefreshCw, 
  Link2, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  KeyRound,
  X
} from 'lucide-react';

const PLATFORMS: Platform[] = ['Instagram', 'Facebook', 'YouTube'];
const STATUS_OPTIONS: ConnectionStatus[] = ['Connected', 'Disconnected', 'Pending'];
const CONNECTION_TYPES: { type: ConnectionType; label: string; desc: string }[] = [
  { type: 'manual', label: 'Manual Mode', desc: 'No APIs needed. Copy caption, download media, mark posted manually.' },
  { type: 'mock', label: 'Mock Mode', desc: 'Simulated API connection for testing workflows without real credentials.' },
  { type: 'oauth', label: 'OAuth Mode', desc: 'Real OAuth login with Meta / Google. Requires API keys in .env.local.' },
];

function AccountsContent() {
  const searchParams = useSearchParams();
  const { accounts, addAccount, updateAccount, deleteAccount } = useApp();

  // OAuth server configuration status
  const [oauthStatus, setOauthStatus] = useState<{
    instagram: boolean;
    facebook: boolean;
    youtube: boolean;
  }>({ instagram: false, facebook: false, youtube: false });

  // Banner notification states
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New account form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [connectionType, setConnectionType] = useState<ConnectionType>('manual');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Connected');

  // Fetch safe OAuth configuration from server
  useEffect(() => {
    fetch('/api/oauth/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.configured) {
          setOauthStatus(data.configured);
        }
      })
      .catch((e) => console.warn('Could not check OAuth status:', e));
  }, []);

  // Handle URL query banners
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const connectedParam = searchParams.get('connected');
    const platformParam = searchParams.get('platform');

    if (errorParam === 'oauth_not_configured') {
      setBannerMessage({
        type: 'error',
        text: `OAuth is not configured for ${platformParam || 'this platform'}. Please add credentials in .env.local to enable real OAuth.`,
      });
    } else if (connectedParam === 'true') {
      setBannerMessage({
        type: 'success',
        text: `Successfully connected ${platformParam || 'account'} via OAuth!`,
      });
    }
  }, [searchParams]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Please enter a client name');
      return;
    }

    // Default status for oauth is Pending until authenticated
    const initialStatus = connectionType === 'oauth' ? 'Pending' : connectionStatus;

    await addAccount({
      clientName: clientName.trim(),
      platform,
      connectionType,
      connectionStatus: initialStatus,
    });

    setClientName('');
    setShowAddForm(false);
  };

  const cycleStatus = async (id: string, current: ConnectionStatus) => {
    const nextMap: Record<ConnectionStatus, ConnectionStatus> = {
      Connected: 'Disconnected',
      Disconnected: 'Pending',
      Pending: 'Connected',
    };
    await updateAccount(id, { connectionStatus: nextMap[current] });
  };

  const toggleMockConnection = async (id: string, current: ConnectionStatus) => {
    const newStatus: ConnectionStatus = current === 'Connected' ? 'Disconnected' : 'Connected';
    await updateAccount(id, { connectionStatus: newStatus });
  };

  const isPlatformOAuthConfigured = (p: Platform) => {
    const key = p.toLowerCase() as keyof typeof oauthStatus;
    return Boolean(oauthStatus[key]);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">
            Manage your client social media accounts with Manual, Mock, or OAuth connections.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>{showAddForm ? 'Cancel' : 'Add Account'}</span>
        </button>
      </div>

      {/* Banner Message */}
      {bannerMessage && (
        <div
          style={{
            background: bannerMessage.type === 'error' ? 'var(--danger-light)' : 'var(--success-light)',
            border: `1px solid ${bannerMessage.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            color: bannerMessage.type === 'error' ? '#991b1b' : '#065f46',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {bannerMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Add Account Card */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.75rem', borderColor: '#bfdbfe' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
            Add New Account
          </h2>
          <form onSubmit={handleAddSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Fitness Studio"
                  className="form-input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Platform</label>
                <select
                  className="form-select"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Connection Type</label>
                <select
                  className="form-select"
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value as ConnectionType)}
                >
                  {CONNECTION_TYPES.map((ct) => (
                    <option key={ct.type} value={ct.type}>
                      {ct.label}
                    </option>
                  ))}
                </select>
                <p className="form-helper">
                  {CONNECTION_TYPES.find((c) => c.type === connectionType)?.desc}
                </p>
              </div>

              {connectionType !== 'oauth' && (
                <div className="form-group">
                  <label className="form-label">Connection Status (Manual)</label>
                  <select
                    className="form-select"
                    value={connectionStatus}
                    onChange={(e) => setConnectionStatus(e.target.value as ConnectionStatus)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* OAuth Status Warning in Form */}
            {connectionType === 'oauth' && (
              <div 
                style={{ 
                  background: isPlatformOAuthConfigured(platform) ? '#eff6ff' : '#fef2f2',
                  border: `1px solid ${isPlatformOAuthConfigured(platform) ? '#bfdbfe' : '#fecaca'}`,
                  borderRadius: 'var(--radius)',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}
              >
                {isPlatformOAuthConfigured(platform) ? (
                  <div style={{ color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <KeyRound size={16} />
                    <span>OAuth keys detected in server environment. Ready to link upon saving.</span>
                  </div>
                ) : (
                  <div style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>
                      <strong>OAuth Not Configured:</strong> Missing client ID & secret in server environment. 
                      You can still save this account; it will show &quot;Not Configured&quot; until keys are set in <code>.env.local</code>.
                    </span>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                Save Account
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts Table */}
      {accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <ShieldCheck size={40} />
          </div>
          <h3 className="empty-title">No accounts added yet</h3>
          <p className="empty-desc">
            Add your first client account above to start creating and scheduling posts.
          </p>
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <Plus size={15} /> Add First Account
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Platform</th>
                <th>Connection Type</th>
                <th>Connection Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => {
                const oauthConfigured = isPlatformOAuthConfigured(acc.platform);

                return (
                  <tr key={acc.id}>
                    <td style={{ fontWeight: 600 }}>{acc.clientName}</td>
                    <td>
                      <PlatformBadge platform={acc.platform} />
                    </td>
                    <td>
                      <span className={`type-badge ${acc.connectionType}`}>
                        {acc.connectionType}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        {acc.connectionType === 'oauth' && !oauthConfigured ? (
                          <span className="badge-not-configured" title="Missing API credentials in .env.local">
                            <AlertCircle size={11} />
                            <span>Not Configured</span>
                          </span>
                        ) : (
                          <span
                            className={`conn-badge ${acc.connectionStatus}`}
                            onClick={() => {
                              if (acc.connectionType === 'manual') {
                                cycleStatus(acc.id, acc.connectionStatus);
                              } else if (acc.connectionType === 'mock') {
                                toggleMockConnection(acc.id, acc.connectionStatus);
                              }
                            }}
                            title={acc.connectionType === 'manual' ? 'Click to cycle status' : 'Connection status'}
                          >
                            {acc.connectionStatus === 'Connected' && '●'}
                            {acc.connectionStatus === 'Disconnected' && '○'}
                            {acc.connectionStatus === 'Pending' && '◐'}
                            {' '}{acc.connectionStatus}
                          </span>
                        )}

                        {/* Interactive toggle for manual & mock */}
                        {acc.connectionType === 'manual' && (
                          <button
                            onClick={() => cycleStatus(acc.id, acc.connectionStatus)}
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Cycle manual status"
                          >
                            <RefreshCw size={11} />
                          </button>
                        )}

                        {acc.connectionType === 'mock' && (
                          <button
                            onClick={() => toggleMockConnection(acc.id, acc.connectionStatus)}
                            className="btn-secondary"
                            style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', borderRadius: '4px', cursor: 'pointer' }}
                            title="Toggle mock connection"
                          >
                            {acc.connectionStatus === 'Connected' ? 'Disconnect' : 'Connect'}
                          </button>
                        )}

                        {/* OAuth Action Link */}
                        {acc.connectionType === 'oauth' && (
                          oauthConfigured ? (
                            <a
                              href={`/api/oauth/${acc.platform.toLowerCase()}?accountId=${encodeURIComponent(acc.id)}`}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                              title="Authenticate with OAuth"
                            >
                              <Link2 size={11} />
                              <span>{acc.connectionStatus === 'Connected' ? 'Re-link' : 'Connect'}</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              (Add keys in .env)
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => deleteAccount(acc.id)}
                        className="btn-danger-outline"
                        title="One-click delete account"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="main-content"><p>Loading accounts...</p></div>}>
      <AccountsContent />
    </Suspense>
  );
}
