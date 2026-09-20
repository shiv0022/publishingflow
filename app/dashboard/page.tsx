'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { InstagramIcon, FacebookIcon } from '@/components/PlatformIcons';
import {
  LayoutDashboard, Link2, TrendingUp, Users, Eye,
  Heart, MessageCircle, Share2, ArrowRight, Zap,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded, accounts, posts, autoReplyRules } = useApp();
  const [feedStats, setFeedStats] = useState<{
    igCount: number; fbCount: number;
    totalLikes: number; totalComments: number; totalViews: number;
  }>({ igCount: 0, fbCount: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });

  useEffect(() => {
    if (isLoaded && !user.loggedIn) router.replace('/');
  }, [isLoaded, user.loggedIn, router]);

  // Fetch live stats from API
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/meta/feed?platform=all');
        const data = await res.json();
        if (data.items && Array.isArray(data.items)) {
          const igItems = data.items.filter((i: any) => i.platform === 'Instagram');
          const fbItems = data.items.filter((i: any) => i.platform === 'Facebook');
          const totalLikes = data.items.reduce((s: number, i: any) => s + (i.likeCount || 0), 0);
          const totalComments = data.items.reduce((s: number, i: any) => s + (i.commentCount || 0), 0);
          const totalViews = data.items.reduce((s: number, i: any) => s + (i.viewCount || 0), 0);
          setFeedStats({
            igCount: igItems.length,
            fbCount: fbItems.length,
            totalLikes,
            totalComments,
            totalViews,
          });
        }
      } catch {}
    }
    if (isLoaded && user.loggedIn) fetchStats();
  }, [isLoaded, user.loggedIn]);

  if (!isLoaded || !user.loggedIn) return null;

  const connectedAccounts = accounts.filter(a => a.connectionStatus === 'Connected' && a.connectionType === 'oauth');
  const igAccounts = connectedAccounts.filter(a => a.platform === 'Instagram');
  const fbAccounts = connectedAccounts.filter(a => a.platform === 'Facebook');
  const activeRules = autoReplyRules.filter(r => r.isActive);
  const totalDmsSent = autoReplyRules.reduce((s, r) => s + (r.triggerCount || 0), 0);

  const statCards = [
    {
      label: 'Connected Accounts',
      value: connectedAccounts.length,
      icon: <Users size={20} />,
      color: '#4f46e5',
      bg: '#eef2ff',
      sub: `${igAccounts.length} IG · ${fbAccounts.length} FB`,
    },
    {
      label: 'Total Likes',
      value: feedStats.totalLikes.toLocaleString(),
      icon: <Heart size={20} />,
      color: '#e11d48',
      bg: '#fff1f2',
      sub: 'Across all posts',
    },
    {
      label: 'Total Views',
      value: feedStats.totalViews.toLocaleString(),
      icon: <Eye size={20} />,
      color: '#0891b2',
      bg: '#ecfeff',
      sub: 'Video views',
    },
    {
      label: 'Auto DMs Sent',
      value: totalDmsSent,
      icon: <Zap size={20} />,
      color: '#7c3aed',
      bg: '#f5f3ff',
      sub: `${activeRules.length} active rules`,
    },
  ];

  const quickActions = [
    { label: 'Connect Accounts', href: '/connect', icon: <Link2 size={18} />, desc: 'Link Facebook & Instagram', color: '#1877f2' },
    { label: 'Instagram Feed', href: '/instagram', icon: <InstagramIcon size={18} />, desc: `${feedStats.igCount} posts`, color: '#E1306C' },
    { label: 'Facebook Feed', href: '/facebook', icon: <FacebookIcon size={18} />, desc: `${feedStats.fbCount} posts`, color: '#1877F2' },
    { label: 'Auto DM Rules', href: '/instagram/auto-dm', icon: <Zap size={18} />, desc: `${activeRules.length} rules active`, color: '#7c3aed' },
  ];

  return (
    <div className="app-container" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#eef2ff', color: '#4f46e5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LayoutDashboard size={22} />
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.6rem' }}>
              Welcome back, {user.name}!
            </h1>
            <p className="page-desc">Here&apos;s your social media overview</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.15rem',
        marginBottom: '2rem',
      }}>
        {statCards.map((stat) => (
          <div key={stat.label} className="card" style={{
            padding: '1.35rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: stat.color,
            }} />
            <div style={{
              width: '46px', height: '46px', borderRadius: '12px',
              background: stat.bg, color: stat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>{stat.label}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '2px' }}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
          Quick Actions
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                textDecoration: 'none', cursor: 'pointer',
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: `${action.color}12`,
                color: action.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {action.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{action.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{action.desc}</div>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </Link>
          ))}
        </div>
      </div>

      {/* Connected Accounts Summary */}
      {connectedAccounts.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Connected Accounts
            </h3>
            <Link href="/connect" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {connectedAccounts.map((acc) => (
              <div key={acc.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.7rem 0.85rem',
                borderRadius: '10px', background: '#f8fafc',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: acc.platform === 'Instagram' ? '#fdf2f8' : '#eff6ff',
                  color: acc.platform === 'Instagram' ? '#db2777' : '#1877f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {acc.platform === 'Instagram' ? <InstagramIcon size={16} /> : <FacebookIcon size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{acc.clientName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{acc.platform}</div>
                </div>
                <span className="badge badge-success">
                  <CheckCircle2 size={10} /> Connected
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {connectedAccounts.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Link2 size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            No accounts connected yet
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Connect your Facebook & Instagram accounts to get started
          </p>
          <Link href="/connect" className="btn btn-primary">
            <Link2 size={16} /> Connect Accounts
          </Link>
        </div>
      )}
    </div>
  );
}
