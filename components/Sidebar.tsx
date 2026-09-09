'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Send, 
  Layers, 
  Users, 
  RotateCcw, 
  Share2, 
  Database, 
  HardDrive, 
  RotateCw,
  Clock,
  Shield,
  FileText,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { posts, accounts, isUsingSupabase, resetToDummyData, triggerSchedulerWorker } = useApp();
  const [isRunningScheduler, setIsRunningScheduler] = React.useState(false);
  const [schedulerMsg, setSchedulerMsg] = React.useState<string | null>(null);

  const handleReset = async () => {
    if (window.confirm('Reset all posts and accounts to default demo data?')) {
      await resetToDummyData();
    }
  };

  const handleRunScheduler = async () => {
    setIsRunningScheduler(true);
    setSchedulerMsg(null);
    try {
      const res = await triggerSchedulerWorker();
      setSchedulerMsg(res.message);
      setTimeout(() => setSchedulerMsg(null), 3500);
    } finally {
      setIsRunningScheduler(false);
    }
  };

  const navItems = [
    {
      href: '/create',
      label: 'Create Post',
      icon: <Send size={18} />,
      badge: null,
      isActive: pathname === '/' || pathname === '/create',
    },
    {
      href: '/status',
      label: 'Queue & Dashboard',
      icon: <Layers size={18} />,
      badge: posts.length > 0 ? posts.length : null,
      isActive: pathname === '/status',
    },
    {
      href: '/accounts',
      label: 'Connected Accounts',
      icon: <Users size={18} />,
      badge: accounts.length > 0 ? accounts.length : null,
      isActive: pathname === '/accounts',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={onClose}
        />
      )}

      <aside className={`saas-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link href="/create" className="sidebar-brand" onClick={onClose}>
            <div className="brand-logo-icon">
              <Share2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="brand-title">PublishingFlow</span>
              <span className="brand-tag">PRO SAAS</span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button 
            type="button" 
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="sidebar-nav-container">
          <p className="sidebar-section-title">MAIN NAVIGATION</p>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`sidebar-nav-item ${item.isActive ? 'active' : ''}`}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
                {item.badge !== null && (
                  <span className={`nav-item-badge ${item.isActive ? 'active-badge' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <p className="sidebar-section-title" style={{ marginTop: '1.5rem' }}>COMPLIANCE & SYSTEM</p>
          <nav className="sidebar-nav">
            <Link
              href="/privacy"
              onClick={onClose}
              className={`sidebar-nav-item ${pathname === '/privacy' ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><Shield size={16} /></span>
              <span className="nav-item-label">Privacy Policy</span>
            </Link>
            <Link
              href="/data-deletion"
              onClick={onClose}
              className={`sidebar-nav-item ${pathname === '/data-deletion' ? 'active' : ''}`}
            >
              <span className="nav-item-icon"><FileText size={16} /></span>
              <span className="nav-item-label">Data Deletion</span>
            </Link>
          </nav>
        </div>

        {/* Footer / System Status Card */}
        <div className="sidebar-footer">
          {/* Scheduler Status & Trigger */}
          <div className="scheduler-status-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={12} style={{ color: 'var(--primary)' }} />
                <span>SCHEDULER ENGINE</span>
              </span>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }} />
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.6rem' }}>
              Auto-publishing every 30s
            </p>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', gap: '0.35rem' }}
              onClick={handleRunScheduler}
              disabled={isRunningScheduler}
            >
              <RotateCw size={12} className={isRunningScheduler ? 'animate-spin' : ''} />
              <span>{isRunningScheduler ? 'Processing...' : 'Run Scheduler Now'}</span>
            </button>
            {schedulerMsg && (
              <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.35rem', textAlign: 'center' }}>
                {schedulerMsg}
              </p>
            )}
          </div>

          {/* Database indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0.75rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {isUsingSupabase ? (
                <>
                  <Database size={13} style={{ color: '#059669' }} />
                  <span style={{ fontWeight: 600, color: '#065f46' }}>Supabase DB</span>
                </>
              ) : (
                <>
                  <HardDrive size={13} style={{ color: '#64748b' }} />
                  <span style={{ fontWeight: 600, color: '#475569' }}>Local Storage</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.72rem',
              }}
              title="Clear all posts and accounts"
            >
              <RotateCcw size={11} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
