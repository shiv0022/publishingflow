'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PlatformBadge } from '@/components/PlatformBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { PostStatus, Platform, AuditLog } from '@/types';
import { 
  Trash2, 
  Calendar, 
  Clock, 
  Plus, 
  Inbox, 
  FileImage, 
  CheckCircle, 
  Copy, 
  Download, 
  Send, 
  Check, 
  X, 
  AlertTriangle, 
  RotateCw,
  History,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const STATUS_FILTERS: { label: string; value: 'all' | PostStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Draft', value: 'draft' },
  { label: 'Posted', value: 'posted' },
  { label: 'Failed', value: 'failed' },
];

function StatusContent() {
  const searchParams = useSearchParams();
  const { posts, accounts, deletePost, updatePostStatus } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | PostStatus>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Copied state tracker per post
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  
  // Real publish loading & feedback
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishFeedback, setPublishFeedback] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);

  // Automated Scheduler state
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [schedulerMessage, setSchedulerMessage] = useState<string | null>(null);

  // Audit Logs
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Success banner from query
  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccessBanner(true);
      const timer = setTimeout(() => setShowSuccessBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Automated Background Scheduler (checks every 60 seconds for due scheduled posts)
  useEffect(() => {
    const runSchedulerCheck = async () => {
      try {
        const res = await fetch('/api/cron/publish-scheduled');
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            console.log('[Scheduler Worker]: Processed due scheduled posts:', data.results);
          }
        }
      } catch (e) {
        // Background check safe catch
      }
    };

    // Run on mount
    runSchedulerCheck();
    // Run interval
    const interval = setInterval(runSchedulerCheck, 60000);
    return () => clearInterval(interval);
  }, []);

  // Manual Trigger for Scheduler
  const handleTriggerScheduler = async () => {
    setIsSchedulerRunning(true);
    setSchedulerMessage(null);
    try {
      const res = await fetch('/api/cron/publish-scheduled', { method: 'POST' });
      const data = await res.json();
      setSchedulerMessage(data.message || 'Scheduler run complete.');
      setTimeout(() => setSchedulerMessage(null), 4000);
    } catch (err: any) {
      setSchedulerMessage('Scheduler check failed: ' + err.message);
    } finally {
      setIsSchedulerRunning(false);
    }
  };

  // Fetch Audit Logs
  const handleOpenAuditLogs = async () => {
    setShowAuditModal(true);
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.warn('Could not load audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Filtered posts
  const filteredPosts = posts.filter((post) => {
    const matchesStatus = activeFilter === 'all' || post.status === activeFilter;
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
    return matchesStatus && matchesPlatform;
  });

  // Calculate dashboard stats
  const connectedAccountsCount = accounts.filter((a) => a.connectionStatus === 'Connected').length;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'posted').length;
  const failedCount = posts.filter((p) => p.status === 'failed').length;

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const cycleStatus = async (id: string, current: PostStatus) => {
    const sequence: Record<PostStatus, PostStatus> = {
      draft: 'scheduled',
      scheduled: 'posted',
      posted: 'failed',
      failed: 'draft',
    };
    await updatePostStatus(id, sequence[current]);
  };

  // Manual Mode: Copy Caption & Title to clipboard
  const handleCopyContent = async (post: typeof posts[0]) => {
    const textToCopy = `${post.title ? post.title + '\n\n' : ''}${post.caption}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedPostId(post.id);
      setTimeout(() => setCopiedPostId(null), 2500);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  // Manual Mode: Download media file
  const handleDownloadMedia = (mediaUrl?: string, filename?: string) => {
    if (!mediaUrl) return;
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = filename || 'post-media';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manual Mode: Mark as Posted
  const handleMarkAsPosted = async (id: string) => {
    await updatePostStatus(id, 'posted', new Date().toISOString());
  };

  // Real OAuth Publishing
  const handleRealPublish = async (post: typeof posts[0]) => {
    setPublishingId(post.id);
    setPublishFeedback(null);

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Publishing failed');
      }

      await updatePostStatus(post.id, 'posted', data.publishedAt || new Date().toISOString());
      setPublishFeedback({ id: post.id, type: 'success', text: data.message || 'Published successfully!' });
    } catch (err: any) {
      setPublishFeedback({ id: post.id, type: 'error', text: err.message || 'Failed to publish' });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="main-content">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Publishing Dashboard</h1>
          <p className="page-subtitle">
            Connected accounts, scheduling queue, real-time publishing, and audit trail.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Audit Logs Drawer Button */}
          <button
            onClick={handleOpenAuditLogs}
            className="btn btn-secondary"
            title="View system audit logs"
          >
            <History size={15} />
            <span>Audit Trail</span>
          </button>

          {/* Trigger Scheduler Button */}
          <button
            onClick={handleTriggerScheduler}
            disabled={isSchedulerRunning}
            className="btn btn-secondary"
            title="Check and trigger due scheduled posts immediately"
          >
            <RotateCw size={14} className={isSchedulerRunning ? 'animate-spin' : ''} />
            <span>{isSchedulerRunning ? 'Checking...' : 'Run Scheduler'}</span>
          </button>

          <Link href="/create" className="btn btn-primary">
            <Plus size={16} />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      {/* Scheduler feedback notification */}
      {schedulerMessage && (
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          padding: '0.5rem 0.85rem',
          borderRadius: 'var(--radius)',
          fontSize: '0.8rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{schedulerMessage}</span>
          <button onClick={() => setSchedulerMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dashboard Overview Cards */}
      <div className="dashboard-stats">
        <div className="stat-box">
          <span className="stat-label">Connected Accounts</span>
          <span className="stat-value" style={{ color: '#059669' }}>{connectedAccountsCount}</span>
          <span className="stat-subtext">{accounts.length} total profiles</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">Scheduled Posts</span>
          <span className="stat-value" style={{ color: '#2563eb' }}>{scheduledCount}</span>
          <span className="stat-subtext">Auto-publishing enabled</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">Published Posts</span>
          <span className="stat-value" style={{ color: '#10b981' }}>{publishedCount}</span>
          <span className="stat-subtext">Live on social platforms</span>
        </div>

        <div className="stat-box">
          <span className="stat-label">Failed Posts</span>
          <span className="stat-value" style={{ color: failedCount > 0 ? '#ef4444' : '#64748b' }}>{failedCount}</span>
          <span className="stat-subtext">Automatic retry up to 3x</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {showSuccessBanner && (
        <div
          style={{
            background: 'var(--success-light)',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 'var(--radius)',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} color="#059669" />
            <span>Post created successfully!</span>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        {/* Status Filter Tabs */}
        <div className="filter-pills">
          {STATUS_FILTERS.map((tab) => {
            const count = tab.value === 'all' 
              ? posts.length 
              : posts.filter((p) => p.status === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`filter-pill-btn ${activeFilter === tab.value ? 'active' : ''}`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Platform Dropdown Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Platform:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as 'all' | Platform)}
          >
            <option value="all">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="YouTube">YouTube</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Inbox size={40} />
          </div>
          <h3 className="empty-title">No posts match this filter</h3>
          <p className="empty-desc">
            Try selecting a different filter or create a new post to populate this view.
          </p>
          <Link href="/create" className="btn btn-primary">
            <Plus size={15} /> Create a Post
          </Link>
        </div>
      ) : (
        <div className="posts-grid">
          {filteredPosts.map((post) => {
            const matchedAccount = accounts.find((a) => a.clientName === post.clientName && a.platform === post.platform);
            const isOauthConnected = 
              matchedAccount?.connectionType === 'oauth' && 
              matchedAccount?.connectionStatus === 'Connected';

            return (
              <div key={post.id} className="post-card">
                {/* Media Thumbnail */}
                <div className="post-card-thumb">
                  {post.mediaUrl ? (
                    post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} muted preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.mediaUrl} alt={post.title || 'Media preview'} />
                    )
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                      <FileImage size={24} />
                      <span style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>No Media</span>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="post-card-content">
                  <div>
                    {/* Top Bar: Platform, Client, & Status */}
                    <div className="post-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <PlatformBadge platform={post.platform} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {post.clientName}
                        </span>
                        {matchedAccount && (
                          <span className={`type-badge ${matchedAccount.connectionType}`}>
                            {matchedAccount.connectionType}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Interactive Status Badge */}
                        <span 
                          onClick={() => cycleStatus(post.id, post.status)}
                          style={{ cursor: 'pointer' }}
                          title="Click to cycle status"
                        >
                          <StatusBadge status={post.status} />
                        </span>

                        {/* Status Selector */}
                        <select
                          value={post.status}
                          onChange={(e) => updatePostStatus(post.id, e.target.value as PostStatus)}
                          className="form-select"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', width: 'auto' }}
                          title="Select post status"
                        >
                          <option value="draft">draft</option>
                          <option value="scheduled">scheduled</option>
                          <option value="posted">posted</option>
                          <option value="failed">failed</option>
                        </select>
                      </div>
                    </div>

                    {/* Title & Caption */}
                    {post.title && <h3 className="post-title">{post.title}</h3>}
                    {post.caption && <p className="post-caption">{post.caption}</p>}
                    {post.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                        Note: {post.description}
                      </p>
                    )}

                    {/* Failure details if post failed */}
                    {post.status === 'failed' && post.lastError && (
                      <div style={{
                        fontSize: '0.75rem',
                        marginTop: '0.4rem',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '4px',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <AlertCircle size={13} />
                        <span>Error: {post.lastError} (Retries: {post.retryCount || 0}/{post.maxRetries || 3})</span>
                      </div>
                    )}

                    {/* Publishing Feedback Alert */}
                    {publishFeedback?.id === post.id && (
                      <div 
                        style={{ 
                          fontSize: '0.78rem', 
                          marginTop: '0.5rem', 
                          padding: '0.4rem 0.65rem',
                          borderRadius: '4px',
                          background: publishFeedback.type === 'error' ? '#fef2f2' : '#ecfdf5',
                          color: publishFeedback.type === 'error' ? '#991b1b' : '#047857',
                          border: `1px solid ${publishFeedback.type === 'error' ? '#fecaca' : '#a7f3d0'}`
                        }}
                      >
                        {publishFeedback.text}
                      </div>
                    )}

                    {/* Action Bar (Manual Mode vs True OAuth Publish) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {/* 1. Copy Caption & Title */}
                      <button
                        onClick={() => handleCopyContent(post)}
                        className="btn-action-sm"
                        title="Copy post title & caption to clipboard for manual posting"
                      >
                        {copiedPostId === post.id ? (
                          <>
                            <Check size={12} color="#059669" />
                            <span style={{ color: '#059669' }}>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>

                      {/* 2. Download Media (if attached) */}
                      {post.mediaUrl && (
                        <button
                          onClick={() => handleDownloadMedia(post.mediaUrl, post.mediaName)}
                          className="btn-action-sm"
                          title="Download or view attached media"
                        >
                          <Download size={12} />
                          <span>Download Media</span>
                        </button>
                      )}

                      {/* 3. Mark as Posted (for manual workflow) */}
                      {post.status !== 'posted' && (
                        <button
                          onClick={() => handleMarkAsPosted(post.id)}
                          className="btn-action-sm btn-mark-posted"
                          title="Mark this post as posted after manual publishing"
                        >
                          <CheckCircle size={12} />
                          <span>Mark as Posted</span>
                        </button>
                      )}

                      {/* 4. Real Publish (ONLY enabled when account is truly connected via OAuth) */}
                      {isOauthConnected ? (
                        <button
                          onClick={() => handleRealPublish(post)}
                          disabled={publishingId === post.id || post.status === 'posted'}
                          className="btn-action-sm btn-publish-real"
                          title="Publish directly via OAuth API"
                        >
                          <Send size={12} />
                          <span>
                            {publishingId === post.id ? 'Publishing...' : `Publish to ${post.platform}`}
                          </span>
                        </button>
                      ) : (
                        matchedAccount?.connectionType === 'oauth' && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            (Connect OAuth in Accounts tab to enable direct publishing)
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Footer: Date & One-Click Delete */}
                  <div className="post-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {post.publishedAt ? (
                        <>
                          <CheckCircle size={13} color="#059669" />
                          <span>Published: <strong>{formatDateTime(post.publishedAt)}</strong></span>
                        </>
                      ) : post.status === 'scheduled' || post.isScheduled ? (
                        <>
                          <Calendar size={13} style={{ color: 'var(--primary)' }} />
                          <span>Scheduled for: <strong>{formatDateTime(post.scheduledAt)}</strong></span>
                        </>
                      ) : (
                        <>
                          <Clock size={13} />
                          <span>Created: {formatDateTime(post.createdAt)}</span>
                        </>
                      )}
                    </div>

                    {/* One-Click Delete Button */}
                    <button
                      onClick={() => deletePost(post.id)}
                      className="btn-danger-outline"
                      title="One-click delete post"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>System Audit Trail</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {isLoadingLogs ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading audit logs...</p>
              ) : auditLogs.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No audit logs recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {auditLogs.map((log) => (
                    <div key={log.id} style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-subtle)',
                      fontSize: '0.8rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.action}</span>
                        <span style={{ color: 'var(--text-dim)' }}>{formatDateTime(log.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                        {log.clientName && <span>Client: <strong>{log.clientName}</strong></span>}
                        {log.platform && <span>Platform: <strong>{log.platform}</strong></span>}
                        <span>Status: <strong style={{ color: log.status === 'success' ? '#059669' : log.status === 'failed' ? '#dc2626' : '#2563eb' }}>{log.status}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="main-content"><p>Loading dashboard...</p></div>}>
      <StatusContent />
    </Suspense>
  );
}
