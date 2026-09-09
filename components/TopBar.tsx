'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Menu, 
  Plus, 
  RotateCw, 
  Database, 
  HardDrive,
  Share2
} from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const pathname = usePathname();
  const { isUsingSupabase, triggerSchedulerWorker } = useApp();
  const [isRunning, setIsRunning] = React.useState(false);

  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/create') return 'Create Post';
    if (pathname === '/status') return 'Queue & Dashboard';
    if (pathname === '/accounts') return 'Connected Accounts';
    if (pathname === '/privacy') return 'Privacy Policy';
    if (pathname === '/data-deletion') return 'Data Deletion';
    return 'PublishingFlow';
  };

  const handleRunScheduler = async () => {
    setIsRunning(true);
    try {
      await triggerSchedulerWorker();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <header className="saas-topbar">
      <div className="topbar-left">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Brand icon for mobile */}
        <div className="topbar-mobile-brand">
          <div className="brand-logo-icon" style={{ width: '28px', height: '28px' }}>
            <Share2 size={16} strokeWidth={2.5} />
          </div>
        </div>

        {/* Page Title & Breadcrumb */}
        <div className="topbar-title-wrap">
          <h1 className="topbar-page-title">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="topbar-right">
        {/* Storage status badge */}
        <div className="topbar-status-badge">
          {isUsingSupabase ? (
            <span className="badge-pill db-connected" title="PostgreSQL Supabase Connected">
              <Database size={12} />
              <span className="hide-on-mobile">Supabase</span>
            </span>
          ) : (
            <span className="badge-pill db-local" title="Browser Local Storage Fallback">
              <HardDrive size={12} />
              <span className="hide-on-mobile">Local Mode</span>
            </span>
          )}
        </div>

        {/* Trigger scheduler button */}
        <button
          type="button"
          onClick={handleRunScheduler}
          disabled={isRunning}
          className="btn btn-secondary topbar-action-btn"
          title="Run background scheduler now"
        >
          <RotateCw size={13} className={isRunning ? 'animate-spin' : ''} />
          <span className="hide-on-mobile">{isRunning ? 'Running...' : 'Run Scheduler'}</span>
        </button>

        {/* Create Post quick button (if not already on create) */}
        {pathname !== '/' && pathname !== '/create' && (
          <Link href="/create" className="btn btn-primary topbar-action-btn">
            <Plus size={14} />
            <span>Create</span>
          </Link>
        )}
      </div>
    </header>
  );
}
