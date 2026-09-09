'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Account, Platform } from '@/types';
import { InstagramIcon, FacebookIcon, YouTubeIcon } from './PlatformIcons';
import { 
  Search, 
  Check, 
  X, 
  ChevronDown, 
  Users, 
  CheckSquare, 
  Square, 
  Filter,
  AtSign
} from 'lucide-react';

interface AccountRecipientPickerProps {
  accounts: Account[];
  selectedAccountIds: Set<string>;
  onToggleAccount: (id: string) => void;
  onSelectAllConnected: () => void;
  onClearAll: () => void;
  onSelectPlatformOnly: (platform: Platform) => void;
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  Instagram: <InstagramIcon size={14} />,
  Facebook: <FacebookIcon size={14} />,
  YouTube: <YouTubeIcon size={14} />,
};

export function AccountRecipientPicker({
  accounts,
  selectedAccountIds,
  onToggleAccount,
  onSelectAllConnected,
  onClearAll,
  onSelectPlatformOnly,
}: AccountRecipientPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter accounts based on query
  const filteredAccounts = accounts.filter((acc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.clientName.toLowerCase().includes(q) ||
      acc.platform.toLowerCase().includes(q)
    );
  });

  // Selected accounts objects
  const selectedAccounts = accounts.filter((a) => selectedAccountIds.has(a.id));

  // Count by platform
  const hasFbSelected = selectedAccounts.some((a) => a.platform === 'Facebook');
  const hasIgSelected = selectedAccounts.some((a) => a.platform === 'Instagram');
  const hasYtSelected = selectedAccounts.some((a) => a.platform === 'YouTube');

  return (
    <div className="account-recipient-picker" ref={containerRef} style={{ position: 'relative' }}>
      {/* Header Label and Quick Filter Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.6rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AtSign size={14} style={{ color: 'var(--primary)' }} />
          <span>Post To (Recipients)</span>
          <span style={{
            fontSize: '0.75rem',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '0.1rem 0.45rem',
            borderRadius: '999px',
            fontWeight: 700,
          }}>
            {selectedAccountIds.size}
          </span>
        </label>

        {/* Quick Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
            onClick={onSelectAllConnected}
            title="Select all connected accounts"
          >
            All Connected
          </button>

          <button
            type="button"
            className={`btn ${hasIgSelected ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', gap: '0.3rem' }}
            onClick={() => onSelectPlatformOnly('Instagram')}
            title="Toggle Instagram accounts only"
          >
            <InstagramIcon size={12} />
            <span>Instagram</span>
          </button>

          <button
            type="button"
            className={`btn ${hasFbSelected ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', gap: '0.3rem' }}
            onClick={() => onSelectPlatformOnly('Facebook')}
            title="Toggle Facebook accounts only"
          >
            <FacebookIcon size={12} />
            <span>Facebook</span>
          </button>

          <button
            type="button"
            className={`btn ${hasYtSelected ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', gap: '0.3rem' }}
            onClick={() => onSelectPlatformOnly('YouTube')}
            title="Toggle YouTube accounts only"
          >
            <YouTubeIcon size={12} />
            <span>YouTube</span>
          </button>

          {selectedAccountIds.size > 0 && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', color: 'var(--danger)' }}
              onClick={onClearAll}
              title="Clear all selections"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Gmail-Style Compose "To" Recipient Box */}
      <div
        className="recipient-input-box"
        onClick={() => {
          setIsOpen(true);
          searchInputRef.current?.focus();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.4rem',
          minHeight: '46px',
          padding: '0.4rem 0.6rem',
          background: 'var(--bg-card)',
          border: isOpen ? '1.5px solid var(--primary)' : '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          cursor: 'text',
          boxShadow: isOpen ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Selected Account Chips */}
        {selectedAccounts.map((acc) => (
          <span
            key={acc.id}
            className={`recipient-chip platform-${acc.platform.toLowerCase()}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: acc.platform === 'Facebook'
                ? '#eff6ff'
                : acc.platform === 'Instagram'
                ? '#fdf2f8'
                : '#fef2f2',
              border: `1px solid ${
                acc.platform === 'Facebook'
                  ? '#bfdbfe'
                  : acc.platform === 'Instagram'
                  ? '#fbcfe8'
                  : '#fecaca'
              }`,
              color: acc.platform === 'Facebook'
                ? '#1e40af'
                : acc.platform === 'Instagram'
                ? '#9d174d'
                : '#991b1b',
            }}
          >
            {PLATFORM_ICONS[acc.platform]}
            <span>{acc.clientName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleAccount(acc.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '1px',
                borderRadius: '50%',
                color: 'inherit',
              }}
              title="Remove recipient"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        {/* Search Input inline */}
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedAccountIds.size === 0 ? 'Search and select accounts or platforms to publish...' : 'Add more...'}
          style={{
            border: 'none',
            outline: 'none',
            flex: '1',
            minWidth: '160px',
            fontSize: '0.85rem',
            background: 'transparent',
            color: 'var(--text-main)',
            padding: '0.2rem 0.3rem',
          }}
        />

        {/* Toggle Dropdown Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.2rem',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown
            size={16}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* Account Picker Dropdown / Checkbox Menu */}
      {isOpen && (
        <div
          className="recipient-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '0.4rem',
          }}
        >
          {filteredAccounts.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              No accounts match &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const isSelected = selectedAccountIds.has(acc.id);
              const isConnected = acc.connectionStatus === 'Connected';

              return (
                <div
                  key={acc.id}
                  onClick={() => onToggleAccount(acc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    transition: 'background 0.12s ease',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Left: Checkbox + Platform Icon + Client Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid var(--border-strong)',
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {PLATFORM_ICONS[acc.platform]}
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {acc.clientName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        ({acc.platform})
                      </span>
                    </div>
                  </div>

                  {/* Right: Connection Status Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      color: isConnected ? 'var(--success)' : 'var(--danger)',
                      background: isConnected ? 'var(--success-light)' : 'var(--danger-light)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}>
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: isConnected ? 'var(--success)' : 'var(--danger)',
                      }} />
                      <span>{acc.connectionStatus}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Bottom helper */}
          <div style={{
            padding: '0.5rem 0.75rem',
            borderTop: '1px solid var(--border)',
            marginTop: '0.3rem',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Click any account to select or remove</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
