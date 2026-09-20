'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { InstagramIcon, FacebookIcon, FacebookFilledIcon, ThreadsIcon } from '@/components/PlatformIcons';
import { CheckCircle2, AlertTriangle, Link2, Trash2, Shield, Wifi } from 'lucide-react';

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="app-container" style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>}>
      <ConnectContent />
    </Suspense>
  );
}

function ConnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, isLoaded, accounts, deleteAccount, refreshData } = useApp();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user.loggedIn) router.replace('/');
  }, [isLoaded, user.loggedIn, router]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const name = searchParams.get('name');
    if (connected === 'true') {
      if (name && !user.loggedIn) login({ name });
      setSuccessMsg(`Meta account connected successfully${name ? `: ${name}` : ''}!`);
      refreshData();
      setTimeout(() => setSuccessMsg(null), 5000);
    }
    const error = searchParams.get('error');
    if (error) {
      setErrorMsg(`Connection error: ${error}. Please try again.`);
      setTimeout(() => setErrorMsg(null), 6000);
    }
  }, [searchParams, refreshData, login]);

  if (!isLoaded || !user.loggedIn) return null;

  const metaAccounts = accounts.filter(a =>
    (a.platform === 'Facebook' || a.platform === 'Instagram' || a.platform === 'Threads') &&
    a.connectionType === 'oauth' && a.connectionStatus === 'Connected'
  );

  const igAccounts = metaAccounts.filter(a => a.platform === 'Instagram');
  const fbAccounts = metaAccounts.filter(a => a.platform === 'Facebook');

  const handleDisconnect = async (id: string) => {
    if (confirm('Disconnect this account?')) {
      await deleteAccount(id);
      await refreshData();
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '850px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#eff6ff', color: '#1877f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Link2 size={22} />
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.6rem' }}>Connect Accounts</h1>
            <p className="page-desc">Link your Facebook & Instagram accounts via Meta OAuth</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{
          padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)',
          background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46',
          fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)',
          background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239',
          fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          <AlertTriangle size={18} color="#e11d48" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Status Summary */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '1.75rem',
      }}>
        <div className="card" style={{ padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#fdf2f8', color: '#E1306C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <InstagramIcon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{igAccounts.length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Instagram Accounts</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#eff6ff', color: '#1877f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FacebookIcon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{fbAccounts.length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Facebook Pages</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#ecfdf5', color: '#059669',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wifi size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
              {metaAccounts.length > 0 ? 'Active' : 'Inactive'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Connection Status</div>
          </div>
        </div>
      </div>

      {/* Meta OAuth Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1877f2',
            }}>
              <FacebookFilledIcon size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Meta (Facebook + Instagram)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                One login connects all your Facebook Pages & Instagram accounts
              </p>
            </div>
          </div>

          <a
            href={`/api/oauth/facebook${user?.id ? `?userId=${encodeURIComponent(user.id)}` : ''}`}
            className="btn btn-primary"
            style={{ background: '#1877f2', padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}
          >
            <Link2 size={18} />
            <span>{metaAccounts.length > 0 ? 'Add / Reconnect' : 'Connect Meta'}</span>
          </a>
        </div>

        {/* Security Info */}
        <div style={{
          marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)',
          background: '#f8fafc', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          fontSize: '0.82rem', color: 'var(--text-muted)',
        }}>
          <Shield size={16} color="#4f46e5" />
          <span>OAuth 2.0 secure connection · Graph API v22.0 · Tokens stored server-side only</span>
        </div>

        {/* Connected Accounts */}
        {metaAccounts.length > 0 ? (
          <div style={{ marginTop: '1.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Linked Channels ({metaAccounts.length}):
            </span>
            {metaAccounts.map((acc) => (
              <div key={acc.id} style={{
                padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)',
                background: '#f8fafc', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '9px',
                    background: acc.platform === 'Instagram' ? '#fdf2f8' : (acc.platform === 'Threads' ? '#f1f5f9' : '#eff6ff'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: acc.platform === 'Instagram' ? '#db2777' : (acc.platform === 'Threads' ? '#0f172a' : '#1877f2'),
                  }}>
                    {acc.platform === 'Instagram' ? <InstagramIcon size={18} /> :
                     acc.platform === 'Threads' ? <ThreadsIcon size={18} /> :
                     <FacebookIcon size={18} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{acc.clientName}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
                      ({acc.platform})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-success">
                    <CheckCircle2 size={10} /> Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect(acc.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    title="Disconnect"
                  >
                    <Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            marginTop: '1.5rem', padding: '1.5rem',
            borderRadius: 'var(--radius-sm)', background: '#f8fafc',
            border: '1px dashed var(--border)', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: '0.88rem',
          }}>
            No Meta account linked yet. Click &apos;Connect Meta&apos; above to grant Facebook and Instagram permissions.
          </div>
        )}
      </div>
    </div>
  );
}
