'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { InstagramIcon, FacebookIcon, ThreadsIcon } from '@/components/PlatformIcons';
import {
  UploadCloud, X, Send, Calendar, FileVideo, FileImage,
  CheckCircle2, AlertTriangle, Clock, Loader2, Check, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoaded, accounts, addPost, refreshData } = useApp();

  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('video');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [publishResults, setPublishResults] = useState<Array<{ platform: string; success: boolean; error?: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !user.loggedIn) router.replace('/');
  }, [isLoaded, user.loggedIn, router]);

  // Default schedule: tomorrow 10 AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    setScheduleTime(new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16));
  }, []);

  const connectedAccounts = accounts.filter(
    a => a.connectionStatus === 'Connected' &&
         a.connectionType === 'oauth' &&
         (a.platform === 'Facebook' || a.platform === 'Instagram' || a.platform === 'Threads')
  );

  // Auto-select all connected accounts by default
  useEffect(() => {
    if (connectedAccounts.length > 0 && selectedAccounts.size === 0) {
      setSelectedAccounts(new Set(connectedAccounts.map(a => a.id)));
    }
  }, [connectedAccounts.length]);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
    setUploadedUrl('');
    setPublishResults([]);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    setUploadedUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const uploadFile = async (): Promise<string> => {
    if (!mediaFile) return '';
    if (uploadedUrl) return uploadedUrl;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', mediaFile);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        setUploadedUrl(data.url);
        return data.url;
      }
      throw new Error(data.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublishNow = async () => {
    setSubmitError(null);
    setPublishResults([]);

    if (selectedAccounts.size === 0) {
      setSubmitError('Please tick at least one account to publish to.');
      return;
    }
    if (!caption.trim() && !title.trim()) {
      setSubmitError('Please enter a caption or title.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalMediaUrl = '';
      if (mediaFile) {
        finalMediaUrl = await uploadFile();
      }

      const selectedList = connectedAccounts.filter(a => selectedAccounts.has(a.id));
      const results: Array<{ platform: string; success: boolean; error?: string }> = [];

      for (const acc of selectedList) {
        try {
          const post = await addPost({
            clientName: acc.clientName,
            platform: acc.platform,
            accountId: acc.id,
            title: title.trim(),
            caption: caption.trim(),
            description: '',
            mediaUrl: finalMediaUrl || undefined,
            mediaType: finalMediaUrl ? mediaType : undefined,
            mediaName: mediaFile?.name || undefined,
            isScheduled: false,
            status: 'draft',
          });

          const res = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post.id }),
          });
          const data = await res.json();

          if (data.success) {
            results.push({ platform: acc.platform, success: true });
          } else {
            results.push({ platform: acc.platform, success: false, error: data.error });
          }
        } catch (err: any) {
          results.push({ platform: acc.platform, success: false, error: err.message });
        }
      }

      setPublishResults(results);
      await refreshData();

      if (results.every(r => r.success)) {
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Publishing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchedule = async () => {
    setSubmitError(null);
    setPublishResults([]);

    if (selectedAccounts.size === 0) {
      setSubmitError('Please tick at least one account to schedule.');
      return;
    }
    if (!caption.trim() && !title.trim()) {
      setSubmitError('Please enter a caption or title.');
      return;
    }
    if (!scheduleTime) {
      setSubmitError('Please select a date and time.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalMediaUrl = '';
      if (mediaFile) {
        finalMediaUrl = await uploadFile();
      }

      const selectedList = connectedAccounts.filter(a => selectedAccounts.has(a.id));
      const normalizedScheduledAt = new Date(scheduleTime).toISOString();

      for (const acc of selectedList) {
        await addPost({
          clientName: acc.clientName,
          platform: acc.platform,
          accountId: acc.id,
          title: title.trim(),
          caption: caption.trim(),
          description: '',
          mediaUrl: finalMediaUrl || undefined,
          mediaType: finalMediaUrl ? mediaType : undefined,
          mediaName: mediaFile?.name || undefined,
          isScheduled: true,
          scheduledAt: normalizedScheduledAt,
          status: 'scheduled',
        });
      }

      await refreshData();
      router.push('/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'Scheduling failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !user.loggedIn) return null;

  return (
    <div className="app-container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Step 2: Upload &amp; Publish</h1>
        <p className="page-desc">
          Select accounts, upload your video/photo, and publish instantly or schedule.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* 1. SELECT LINKED ACCOUNTS WITH CHECKBOXES */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-main)' }}>
            1. Select Accounts to Publish To
          </h3>

          {connectedAccounts.length === 0 ? (
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <p style={{ fontWeight: 600, color: '#92400e' }}>No Meta accounts linked yet</p>
                <span style={{ fontSize: '0.82rem', color: '#b45309' }}>Link your Meta (Facebook &amp; Instagram) account first.</span>
              </div>
              <Link href="/profile" className="btn btn-primary btn-sm">
                Go to Accounts →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {connectedAccounts.map((acc) => {
                const isChecked = selectedAccounts.has(acc.id);
                return (
                  <label
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isChecked ? '#eef2ff' : '#f8fafc',
                      border: isChecked ? '1px solid #4f46e5' : '1px solid var(--border)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Tick Checkbox */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '5px',
                      background: isChecked ? '#4f46e5' : '#fff',
                      border: isChecked ? 'none' : '2px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>

                    {/* Platform Icon */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: acc.platform === 'Instagram' ? '#fdf2f8' : (acc.platform === 'Threads' ? '#f1f5f9' : '#dbeafe'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: acc.platform === 'Instagram' ? '#db2777' : (acc.platform === 'Threads' ? '#0f172a' : '#2563eb')
                    }}>
                      {acc.platform === 'Instagram' ? <InstagramIcon size={15} /> :
                       acc.platform === 'Threads' ? <ThreadsIcon size={15} /> :
                       <FacebookIcon size={15} />}
                    </div>

                    {/* Account Name */}
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{acc.clientName}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>({acc.platform})</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. MEDIA UPLOAD & VIDEO PREVIEW */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              2. Upload Video / Image
            </h3>
            {mediaFile && (
              <button
                type="button"
                onClick={clearMedia}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger)' }}
              >
                <X size={14} /> Remove Media
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />

          {!mediaFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer'
              }}
            >
              <UploadCloud size={36} color="#4f46e5" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Click to select video or image
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                MP4, MOV, JPG or PNG (Up to 500 MB)
              </p>
            </div>
          ) : (
            <div style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: '#000',
              overflow: 'hidden',
              textAlign: 'center'
            }}>
              {/* Native Live Video / Image Preview Player */}
              {mediaType === 'video' ? (
                <video
                  src={mediaPreview}
                  controls
                  autoPlay={false}
                  style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }}
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: '360px', objectFit: 'contain' }}
                />
              )}
              <div style={{ background: '#f8fafc', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{mediaFile.name}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. TITLE & CAPTION */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
            3. Title &amp; Caption
          </h3>

          <div className="form-group">
            <label className="form-label">Title (Optional - used for Facebook &amp; Threads)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. My New Video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Caption &amp; Hashtags</label>
            <textarea
              className="textarea"
              placeholder="Write your caption here..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* 4. PUBLISH OR SCHEDULE */}
        <div className="card" style={{ border: '2px solid #4f46e5' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
            4. Publish or Schedule
          </h3>

          {submitError && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              fontSize: '0.88rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          {publishResults.length > 0 && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {publishResults.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: r.success ? '#ecfdf5' : '#fff1f2',
                    border: r.success ? '1px solid #a7f3d0' : '1px solid #fecdd3',
                    color: r.success ? '#047857' : '#be123c',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {r.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span><strong>{r.platform}:</strong> {r.success ? 'Successfully published!' : r.error}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Instant Publish Button */}
            <button
              type="button"
              onClick={handlePublishNow}
              disabled={isSubmitting || isUploading || selectedAccounts.size === 0}
              className="btn btn-primary btn-lg"
              style={{ height: '52px', fontSize: '1rem' }}
            >
              {isSubmitting || isUploading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Publish Now ({selectedAccounts.size})</span>
                </>
              )}
            </button>

            {/* Schedule Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="datetime-local"
                className="input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSchedule}
                disabled={isSubmitting || isUploading || selectedAccounts.size === 0}
                className="btn btn-secondary"
                style={{ height: '40px' }}
              >
                <Calendar size={16} />
                <span>Schedule</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
