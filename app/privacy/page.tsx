import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft, ExternalLink, Trash2, Mail, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - PublishingFlow',
  description: 'Privacy Policy for PublishingFlow social media scheduling and publishing platform.',
};

export default function PrivacyPolicyPage() {
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
        background: 'linear-gradient(135deg, #1e40af 0%, #4338ca 50%, #6b21a8 100%)',
        color: '#ffffff',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem', backdropFilter: 'blur(4px)' }}>
          <Shield size={14} />
          <span>Meta &amp; Facebook Developer Policy Compliant</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0, maxWidth: '620px', lineHeight: 1.6 }}>
          How PublishingFlow collects, protects, uses, and respects your data when connecting and publishing to social media platforms.
        </p>
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '0.8rem', opacity: 0.85, display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
          <span><strong>Effective Date:</strong> January 1, 2025</span>
          <span><strong>Last Updated:</strong> March 2026</span>
          <span><strong>App URL:</strong> https://publishingflow-rc85.vercel.app</span>
        </div>
      </header>

      {/* Quick Summary Card */}
      <section style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="#10b981" />
          Summary of Key Commitments
        </h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7, color: 'var(--text-main)', fontSize: '0.92rem' }}>
          <li><strong>Zero Data Selling:</strong> We never sell, rent, monetize, or disclose your personal data or social media tokens to third parties or advertisers.</li>
          <li><strong>Minimal Scope:</strong> We only request permissions necessary to schedule and publish posts to your authorized Facebook Pages, Instagram accounts, and YouTube channels.</li>
          <li><strong>Complete Control:</strong> You can disconnect your accounts or delete all stored data at any time directly in the app or via our <Link href="/data-deletion" style={{ color: '#2563eb', textDecoration: 'underline' }}>Data Deletion page</Link>.</li>
        </ul>
      </section>

      {/* Main Content Articles */}
      <main style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '2rem 1.75rem',
        boxShadow: 'var(--shadow-sm)',
        lineHeight: 1.75,
        color: '#1e293b',
        fontSize: '0.95rem'
      }}>
        {/* Section 1 */}
        <article style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>1</span>
            Introduction &amp; Scope
          </h2>
          <p>
            This Privacy Policy applies to <strong>PublishingFlow</strong> (accessible at <a href="https://publishingflow-rc85.vercel.app" target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>https://publishingflow-rc85.vercel.app</a>), referred to herein as &ldquo;PublishingFlow&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            PublishingFlow is a content scheduling and cross-platform publishing tool designed to help creators, businesses, and publishers draft, schedule, and automate posts to supported platforms including <strong>Facebook Pages</strong>, <strong>Instagram Professional (Business/Creator) Accounts</strong>, and <strong>YouTube</strong>.
          </p>
        </article>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        {/* Section 2 */}
        <article style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>2</span>
            Information We Collect
          </h2>
          <p>When you use PublishingFlow, we collect only the minimum data required to deliver publishing services:</p>
          
          <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
              <strong style={{ display: 'block', color: '#0f172a', marginBottom: '0.25rem' }}>A. Meta Platform Data (Facebook &amp; Instagram)</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                When you authenticate via Facebook OAuth, we receive authorized metadata including your User ID, Page IDs, Page Names, connected Instagram Business Account IDs, and Page Access Tokens. We request only the granted permissions (such as <code>pages_show_list</code>, <code>pages_manage_posts</code>, and <code>instagram_content_publish</code>) necessary to publish content on your behalf.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #dc2626' }}>
              <strong style={{ display: 'block', color: '#0f172a', marginBottom: '0.25rem' }}>B. YouTube &amp; Google Platform Data</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                When you connect YouTube, we receive OAuth tokens authorized solely for the requested Google YouTube scopes (<code>youtube.upload</code> and <code>youtube.readonly</code>) to upload videos and check publication status.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
              <strong style={{ display: 'block', color: '#0f172a', marginBottom: '0.25rem' }}>C. Post Content &amp; Media</strong>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                Post text, captions, image/video URLs, scheduled publish dates, and platform target selections submitted directly by you to initiate publishing workflows.
              </p>
            </div>
          </div>
        </article>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        {/* Section 3 */}
        <article style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>3</span>
            How We Use Your Information
          </h2>
          <p>We use the data collected strictly for the following operational purposes:</p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>To authenticate your ownership or management permissions for social media pages and channels.</li>
            <li>To transmit your approved posts, photos, reels, and video media to Meta Graph API and YouTube API endpoints.</li>
            <li>To check, verify, and display the delivery status (Scheduled, Published, Failed) in your PublishingFlow Status dashboard.</li>
            <li>To maintain diagnostic audit logs to help resolve API rate limits or publishing errors.</li>
          </ul>
          <p style={{ marginTop: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
            We do NOT use Meta platform data for surveillance, profiling, ad targeting, credit evaluation, or any purpose unrelated to PublishingFlow&apos;s direct functionality.
          </p>
        </article>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        {/* Section 4 */}
        <article style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>4</span>
            Data Storage, Encryption &amp; Security
          </h2>
          <p>
            Security is integral to our architecture. Access tokens and API secrets are never exposed to browser clients or public code repositories. Server-side communication with Meta APIs and Supabase databases is conducted over encrypted Transport Layer Security (TLS/HTTPS).
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Access tokens are retained only for the duration that your account remains connected. If you revoke access or delete your connection, tokens are invalidated and purged.
          </p>
        </article>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        {/* Section 5 */}
        <article style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>5</span>
            User Rights &amp; Data Deletion
          </h2>
          <p>
            Under applicable privacy regulations (including GDPR, CCPA, and Meta Developer Terms), you retain full rights over your data, including the right to inspect, revoke, and delete all associated information.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.25rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={16} />
              Need to Delete Your Data?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#14532d', margin: '0 0 0.75rem 0' }}>
              We provide an easy, self-service data deletion process and explicit step-by-step instructions. You can delete individual accounts, post history, or submit a formal deletion request.
            </p>
            <Link 
              href="/data-deletion" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#16a34a',
                color: '#ffffff',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              View User Data Deletion Instructions <ExternalLink size={13} />
            </Link>
          </div>
        </article>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        {/* Section 6 */}
        <article style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>6</span>
            Third-Party Services
          </h2>
          <p>
            PublishingFlow interacts with third-party service providers via official APIs:
          </p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li><strong>Meta Graph API:</strong> For publishing to Facebook Pages &amp; Instagram accounts. Governed by the <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Meta Privacy Policy</a>.</li>
            <li><strong>YouTube API Services:</strong> Governed by the <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Google Privacy Policy</a>.</li>
            <li><strong>Hosting:</strong> Deployed on Vercel infrastructure (<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Vercel Privacy Policy</a>).</li>
          </ul>
        </article>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        {/* Section 7 */}
        <article>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>7</span>
            Contact Us
          </h2>
          <p>
            If you have questions, inquiries, or privacy concerns regarding this policy or the handling of your data in PublishingFlow, please contact our privacy team:
          </p>
          <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'inline-block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 600, fontSize: '0.92rem' }}>
              <Mail size={16} color="#2563eb" />
              <span>Contact Email: privacy@publishingflow.com</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Application: PublishingFlow (https://publishingflow-rc85.vercel.app)
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
