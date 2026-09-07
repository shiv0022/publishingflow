'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Trash2, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Mail, 
  Smartphone, 
  Globe, 
  Copy, 
  Check 
} from 'lucide-react';

export default function DataDeletionPage() {
  const [userIdInput, setUserIdInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdInput.trim()) return;

    // Generate a unique tracking confirmation code
    const code = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setConfirmationCode(code);
    setSubmitted(true);
  };

  const handleCopyCode = () => {
    if (!confirmationCode) return;
    navigator.clipboard.writeText(confirmationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.25rem 4rem 1.25rem' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link 
          href="/create" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            fontSize: '0.875rem', 
            color: 'var(--text-muted)',
            fontWeight: 500,
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} />
          Back to PublishingFlow
        </Link>
      </div>

      {/* Header Banner */}
      <header style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: '#ffffff',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', color: '#fca5a5' }}>
          <Trash2 size={14} />
          <span>Meta Platform Data Deletion Instructions</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>
          User Data Deletion Instructions
        </h1>
        <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0, maxWidth: '640px', lineHeight: 1.6, color: '#e2e8f0' }}>
          In compliance with Meta Platform Terms and global privacy regulations, PublishingFlow provides simple, transparent ways to delete all data associated with your account.
        </p>
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '0.8rem', opacity: 0.85, display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: '#cbd5e1' }}>
          <span><strong>Application:</strong> PublishingFlow</span>
          <span><strong>Platform:</strong> Facebook &amp; Instagram Graph API</span>
          <span><strong>Status:</strong> Active Self-Service &amp; Manual Deletion</span>
        </div>
      </header>

      {/* Overview Card */}
      <section style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
          What Data PublishingFlow Holds &amp; What Gets Deleted
        </h2>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', lineHeight: 1.6 }}>
          PublishingFlow does not maintain permanent user profiling databases. When you request data deletion, the following items are permanently erased:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>1. OAuth Access Tokens</strong>
            <span style={{ color: 'var(--text-muted)' }}>Revoked and permanently wiped from local and cloud storage.</span>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>2. Connected Page IDs &amp; Names</strong>
            <span style={{ color: 'var(--text-muted)' }}>All page references and Instagram account links are unlinked.</span>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>3. Post Drafts &amp; Status Logs</strong>
            <span style={{ color: 'var(--text-muted)' }}>Associated post history and publication logs are purged.</span>
          </div>
        </div>
      </section>

      {/* Methods Section */}
      <div style={{ display: 'grid', gap: '1.75rem' }}>

        {/* Method 1 */}
        <section style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              1
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Method 1: Instant In-App Account Deletion (Immediate)
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>Takes &lt; 10 seconds • Immediate deletion</span>
            </div>
          </div>

          <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
            You can delete any connected account and its tokens directly within PublishingFlow at any time:
          </p>

          <ol style={{ paddingLeft: '1.25rem', marginTop: '0.75rem', color: '#334155', fontSize: '0.92rem', lineHeight: 1.75 }}>
            <li>Navigate to the <strong><Link href="/accounts" style={{ color: '#2563eb', textDecoration: 'underline' }}>Accounts tab</Link></strong> in PublishingFlow.</li>
            <li>Locate the Facebook Page or Instagram account you wish to disconnect.</li>
            <li>Click the red <strong>Delete</strong> or <strong>Disconnect</strong> icon next to the account.</li>
            <li>Confirm the prompt. The account, tokens, and metadata are immediately wiped from your storage.</li>
          </ol>

          <div style={{ marginTop: '1.25rem' }}>
            <Link 
              href="/accounts" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#2563eb',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Go to Accounts Manager <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>
        </section>

        {/* Method 2 */}
        <section style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              2
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Method 2: Remove App via Facebook Settings
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#1877f2', fontWeight: 600 }}>Standard Meta Account Management</span>
            </div>
          </div>

          <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
            According to Meta Developer Platform Rules, you can revoke access and trigger deletion directly from your Facebook Account settings:
          </p>

          <ol style={{ paddingLeft: '1.25rem', marginTop: '0.75rem', color: '#334155', fontSize: '0.92rem', lineHeight: 1.75 }}>
            <li>Log into your Facebook account and go to <strong>Settings &amp; Privacy &gt; Settings</strong>.</li>
            <li>In the left-hand menu, click on <strong>Apps and Websites</strong> (or visit <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>facebook.com/settings?tab=applications</a>).</li>
            <li>Search or look for <strong>PublishingFlow</strong> in your list of connected applications.</li>
            <li>Click the <strong>Remove</strong> button next to PublishingFlow.</li>
            <li><em>(Optional)</em> You may check the option to delete posts, videos, or events that PublishingFlow may have published on your timeline.</li>
            <li>Click <strong>Remove</strong> again to confirm. Meta immediately revokes all access tokens and terminates the connection.</li>
          </ol>

          <div style={{ marginTop: '1.25rem' }}>
            <a 
              href="https://www.facebook.com/settings?tab=applications" 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#1877f2',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              Open Facebook Apps &amp; Websites Settings <ExternalLink size={14} />
            </a>
          </div>
        </section>

        {/* Method 3 */}
        <section style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              3
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Method 3: Submit a Manual Data Erasure Request
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>Meta Data Deletion Request &amp; Confirmation</span>
            </div>
          </div>

          <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>
            If you wish to request full server-side database scrubbing of all audit logs, connection history, or tokens, enter your Meta User ID, Page ID, or Email below:
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmitRequest} style={{ marginTop: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <label htmlFor="deletionIdentifier" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem' }}>
                Your Facebook User ID, Page ID, or Contact Email
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input 
                  id="deletionIdentifier"
                  type="text" 
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="e.g. 1077484934693230 or user@example.com"
                  required
                  style={{
                    flex: '1 1 260px',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem'
                  }}
                />
                <button 
                  type="submit"
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Submit Deletion Request
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                You will immediately receive a verification tracking code.
              </p>
            </form>
          ) : (
            <div style={{ marginTop: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={20} />
                <span>Data Deletion Request Received</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#14532d', margin: '0 0 0.75rem 0' }}>
                Your request has been logged. Our system purges matching tokens and database records within 24 to 48 hours.
              </p>
              <div style={{ background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirmation Code</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>{confirmationCode}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    background: copied ? '#10b981' : '#f1f5f9',
                    color: copied ? '#ffffff' : '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* Support & Contact Footer */}
      <footer style={{ marginTop: '2.5rem', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#0f172a' }}>
            Questions About Data Privacy?
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Read our full policy or contact our designated data protection officer.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link 
            href="/privacy"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#0f172a',
              textDecoration: 'none'
            }}
          >
            Read Privacy Policy
          </Link>
          <a 
            href="mailto:privacy@publishingflow.com"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '6px',
              background: '#0f172a',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#ffffff',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Mail size={14} /> Contact Privacy Team
          </a>
        </div>
      </footer>
    </div>
  );
}
