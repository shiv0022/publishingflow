import React from 'react';
import Link from 'next/link';
import { Shield, Trash2, Image as ImageIcon, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: '#ffffff',
      marginTop: 'auto',
      padding: '2rem 1.5rem',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>PublishingFlow</span>
          <span>&copy; {new Date().getFullYear()} • Multi-Platform Social Publishing</span>
        </div>

        <nav style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          <Link 
            href="/privacy" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
          >
            <Shield size={14} />
            <span>Privacy Policy</span>
          </Link>

          <Link 
            href="/data-deletion" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
          >
            <Trash2 size={14} />
            <span>User Data Deletion</span>
          </Link>

          <a 
            href="/icon-1024.png" 
            target="_blank" 
            rel="noreferrer"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.35rem', 
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
            title="Download 1024x1024 PNG App Icon for Meta App Review"
          >
            <ImageIcon size={14} />
            <span>1024x1024 App Icon</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
