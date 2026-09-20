'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Link2,
  Image as ImageIconLucide,
  Megaphone,
  MessageSquareText,
  Bot,
  LogOut,
  Share2,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '@/components/PlatformIcons';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & stats',
  },
  {
    href: '/connect',
    label: 'Connect Accounts',
    icon: Link2,
    description: 'Facebook & Instagram',
  },
  {
    href: '/instagram',
    label: 'Instagram',
    icon: InstagramIcon,
    description: 'Posts, likes & views',
    accent: '#E1306C',
  },
  {
    href: '/facebook',
    label: 'Facebook',
    icon: FacebookIcon,
    description: 'Posts, likes & views',
    accent: '#1877F2',
  },
  {
    href: '/instagram/auto-dm',
    label: 'Instagram Auto DM',
    icon: MessageSquareText,
    description: 'Auto reply & DMs',
    accent: '#E1306C',
  },
  {
    href: '/facebook/auto-dm',
    label: 'Facebook Auto DM',
    icon: Bot,
    description: 'Auto reply & DMs',
    accent: '#1877F2',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user.loggedIn) return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/instagram/auto-dm') return pathname === '/instagram/auto-dm';
    if (href === '/facebook/auto-dm') return pathname === '/facebook/auto-dm';
    if (href === '/instagram') return pathname === '/instagram';
    if (href === '/facebook') return pathname === '/facebook';
    return pathname === href;
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Share2 size={20} strokeWidth={2.5} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">PublishingFlow</span>
            <span className="sidebar-brand-tag">Social Manager</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">MENU</div>
          {menuItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className="sidebar-nav-icon"
                  style={active && item.accent ? { color: item.accent } : {}}
                >
                  <Icon size={20} />
                </div>
                <div className="sidebar-nav-content">
                  <span className="sidebar-nav-label-text">{item.label}</span>
                  <span className="sidebar-nav-desc">{item.description}</span>
                </div>
                {active && (
                  <ChevronRight size={14} className="sidebar-nav-arrow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">Manager</span>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-logout-btn"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
