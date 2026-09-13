'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { InstagramIcon, FacebookIcon, ThreadsIcon } from '@/components/PlatformIcons';
import { CheckCircle2, Clock, Trash2, Upload, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded, accounts, posts, deletePost } = useApp();

  useEffect(() => {
    if (isLoaded && !user.loggedIn) router.replace('/');
  }, [isLoaded, user.loggedIn, router]);

  if (!isLoaded || !user.loggedIn) return null;

  const handleDelete = async (id: string) => {
    if (confirm('Delete this post?')) {
      await deletePost(id);
    }
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    if (platform === 'Instagram') return <InstagramIcon size={14} />;
    if (platform === 'Facebook') return <FacebookIcon size={14} />;
    if (platform === 'Threads') return <ThreadsIcon size={14} />;
    return null;
  };

  return (
    <div className="app-container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Step 5: Post Overview</h1>
          <p className="page-desc">
            All your published and scheduled posts.
          </p>
        </div>

        <Link href="/upload" className="btn btn-primary">
          <Plus size={16} />
          <span>New Upload</span>
        </Link>
      </div>

      {/* Posts Table / List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {posts.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              No posts yet
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
              Upload your first video to publish or schedule.
            </p>
            <Link href="/upload" className="btn btn-primary btn-sm">
              <Upload size={15} />
              <span>Upload Video</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {posts.map((post) => {
              const account = accounts.find(a => a.id === post.accountId);
              const platformName = account?.platform || 'Social';

              return (
                <div
                  key={post.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: platformName === 'Instagram' ? '#fdf2f8' : '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: platformName === 'Instagram' ? '#db2777' : '#2563eb'
                    }}>
                      <PlatformIcon platform={platformName} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {account?.clientName || platformName}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          • {platformName}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.15rem',
                        maxWidth: '400px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {post.caption || post.title || '(Media post)'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Status Pill */}
                    {post.status === 'posted' ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={11} /> Published
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <Clock size={11} /> Scheduled
                      </span>
                    )}

                    {/* Date */}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : (post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Instant')}
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--text-dim)', padding: '0.3rem 0.5rem' }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
