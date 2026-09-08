'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Platform } from '@/types';
import { InstagramIcon, FacebookIcon, YouTubeIcon } from '@/components/PlatformIcons';
import {
  UploadCloud, X, Send, Calendar, FileImage, Film,
  Plus, Trash2, Link, Check, Clock
} from 'lucide-react';

interface SelectedAccount {
  accountId: string;
  clientName: string;
  platform: Platform;
}

function extractDriveId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  Instagram: <InstagramIcon size={14} />,
  Facebook: <FacebookIcon size={14} />,
  YouTube: <YouTubeIcon size={14} />,
};

export default function CreatePostPage() {
  const router = useRouter();
  const { accounts, addPost } = useApp();

  // Multi-account selection: Set of account IDs
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  // Media state
  const [mediaTab, setMediaTab] = useState<'upload' | 'url' | 'drive'>('upload');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [urlInput, setUrlInput] = useState('');
  const [driveInput, setDriveInput] = useState('');
  const [driveResolved, setDriveResolved] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post content
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');

  // Schedule / action
  const [action, setAction] = useState<'draft' | 'schedule'>('draft');
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default schedule date (tomorrow 10AM)
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISO = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduleTimes([localISO]);
  }, []);

  // Auto-select all connected accounts on load
  useEffect(() => {
    const connected = accounts.filter(a => a.connectionStatus === 'Connected').map(a => a.id);
    setSelectedAccounts(new Set(connected));
  }, [accounts]);

  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  // Group accounts by client name
  const clientGroups = accounts.reduce<Record<string, typeof accounts>>((acc, a) => {
    if (!acc[a.clientName]) acc[a.clientName] = [];
    acc[a.clientName].push(a);
    return acc;
  }, {});

  // Media upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const isVid = file.type.startsWith('video');
    setMediaType(isVid ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
    setUploadedUrl('');
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setUploadedUrl(data.url);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview);
    setMediaPreview('');
    setUploadedUrl('');
    setUrlInput('');
    setDriveInput('');
    setDriveResolved('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resolveDriveLink = () => {
    const id = extractDriveId(driveInput.trim());
    if (!id) { alert('Invalid Google Drive link. Make sure to share the file with "Anyone with link can view".'); return; }
    const url = getDriveDirectUrl(id);
    setDriveResolved(url);
    setUploadedUrl(url);
    setMediaType('image'); // user can change
  };

  const getFinalMediaUrl = () => {
    if (uploadedUrl) return uploadedUrl;
    if (mediaTab === 'url' && urlInput.startsWith('http')) return urlInput;
    if (mediaTab === 'drive' && driveResolved) return driveResolved;
    return '';
  };

  const addScheduleTime = () => {
    const last = scheduleTimes[scheduleTimes.length - 1];
    if (!last) return;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    const tzOff = next.getTimezoneOffset() * 60000;
    setScheduleTimes([...scheduleTimes, new Date(next.getTime() - tzOff).toISOString().slice(0, 16)]);
  };

  const removeScheduleTime = (i: number) => {
    if (scheduleTimes.length === 1) return;
    setScheduleTimes(scheduleTimes.filter((_, idx) => idx !== i));
  };

  const updateScheduleTime = (i: number, val: string) => {
    const updated = [...scheduleTimes];
    updated[i] = val;
    setScheduleTimes(updated);
  };

  const handleSubmit = async (submitAction: 'publish' | 'draft' | 'schedule') => {
    if (selectedAccounts.size === 0) { alert('Please select at least one account.'); return; }
    if (!caption.trim() && !title.trim()) { alert('Please enter a title or caption.'); return; }
    if (submitAction === 'schedule' && scheduleTimes.some(t => !t)) { alert('Please fill in all schedule times.'); return; }

    let finalMediaUrl = getFinalMediaUrl();

    // Upload file if not yet uploaded
    if (mediaFile && !finalMediaUrl) {
      setIsUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', mediaFile);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) finalMediaUrl = data.url;
      } finally {
        setIsUploading(false);
      }
    }

    setIsSubmitting(true);
    try {
      const selectedAccountsList = accounts.filter(a => selectedAccounts.has(a.id));
      const timesToCreate = submitAction === 'schedule' ? scheduleTimes : [undefined];

      for (const acc of selectedAccountsList) {
        for (const schedTime of timesToCreate) {
          await addPost({
            clientName: acc.clientName,
            platform: acc.platform,
            accountId: acc.id,
            title: title.trim(),
            caption: caption.trim(),
            description: description.trim(),
            mediaUrl: finalMediaUrl || undefined,
            mediaType: finalMediaUrl ? mediaType : undefined,
            mediaName: mediaFile?.name || (finalMediaUrl ? 'media' : undefined),
            isScheduled: submitAction === 'schedule',
            scheduledAt: schedTime,
            status: submitAction === 'schedule' ? 'scheduled' : 'draft',
          });
        }
      }

      router.push('/status?created=true');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPosts = selectedAccounts.size * (action === 'schedule' ? scheduleTimes.length : 1);

  return (
    <div className="main-content" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Post</h1>
          <p className="page-subtitle">Publish or schedule content across multiple platforms at once.</p>
        </div>
      </div>

      <div className="card">
        {/* ======== ACCOUNT SELECTION ======== */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Select Accounts & Platforms</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary"
                style={{ padding: '0.25rem 0.7rem', fontSize: '0.75rem' }}
                onClick={() => setSelectedAccounts(new Set(accounts.filter(a => a.connectionStatus === 'Connected').map(a => a.id)))}>
                Select All Connected
              </button>
              <button type="button" className="btn btn-secondary"
                style={{ padding: '0.25rem 0.7rem', fontSize: '0.75rem' }}
                onClick={() => setSelectedAccounts(new Set())}>
                Clear
              </button>
            </div>
          </div>

          <div className="account-select-grid">
            {Object.entries(clientGroups).map(([clientName, accs]) => (
              <div key={clientName} className="account-client-block">
                <div className="account-client-name">{clientName}</div>
                <div className="account-platform-options">
                  {accs.map((acc) => {
                    const isSelected = selectedAccounts.has(acc.id);
                    const isDisconnected = acc.connectionStatus !== 'Connected';
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        className={`account-platform-chip ${isSelected ? `selected-${acc.platform}` : ''} ${isDisconnected ? 'disconnected' : ''}`}
                        onClick={() => !isDisconnected && toggleAccount(acc.id)}
                        title={isDisconnected ? `${acc.platform} — Not Connected` : `${acc.platform} — Click to toggle`}
                      >
                        {PLATFORM_ICONS[acc.platform]}
                        <span>{acc.platform}</span>
                        {isSelected && <Check size={11} />}
                        {isDisconnected && <span style={{ fontSize: '0.65rem' }}>✗</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {accounts.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem', textAlign: 'center' }}>
              No accounts found. <a href="/accounts" style={{ color: 'var(--primary)' }}>Add accounts first →</a>
            </div>
          )}
          <p className="form-helper">
            {selectedAccounts.size} account{selectedAccounts.size !== 1 ? 's' : ''} selected
            {action === 'schedule' && scheduleTimes.length > 1 ? ` × ${scheduleTimes.length} times = ${totalPosts} posts` : ''}
          </p>
        </div>

        {/* ======== MEDIA ======== */}
        <div className="form-group">
          <label className="form-label">Media</label>

          <div className="media-tabs">
            {[
              { id: 'upload', icon: <UploadCloud size={14} />, label: 'Upload File' },
              { id: 'url', icon: <Link size={14} />, label: 'Direct URL' },
              { id: 'drive', icon: <Film size={14} />, label: 'Google Drive' },
            ].map(t => (
              <button key={t.id} type="button"
                className={`media-tab ${mediaTab === t.id ? 'active' : ''}`}
                onClick={() => { setMediaTab(t.id as typeof mediaTab); removeMedia(); }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* Upload tab */}
          {mediaTab === 'upload' && !mediaPreview && (
            <div className="media-dropzone" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Click to upload Image or Video</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>JPG, PNG, MP4, MOV — uploads to public storage</p>
            </div>
          )}

          {/* URL tab */}
          {mediaTab === 'url' && (
            <div>
              <div className="drive-link-box">
                <Link size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                <input type="url" placeholder="https://example.com/image.jpg or video.mp4"
                  value={urlInput} onChange={e => { setUrlInput(e.target.value); setUploadedUrl(e.target.value); }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input type="radio" checked={mediaType === 'image'} onChange={() => setMediaType('image')} /> Image
                </label>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input type="radio" checked={mediaType === 'video'} onChange={() => setMediaType('video')} /> Video
                </label>
              </div>
              {urlInput && urlInput.startsWith('http') && (
                <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.35rem' }}>✓ URL will be used as media</p>
              )}
            </div>
          )}

          {/* Google Drive tab */}
          {mediaTab === 'drive' && (
            <div>
              <div className="drive-link-box">
                <Film size={16} style={{ color: '#34a853', flexShrink: 0 }} />
                <input type="text" placeholder="Paste Google Drive link (file must be public)"
                  value={driveInput} onChange={e => { setDriveInput(e.target.value); setDriveResolved(''); }} />
                <button type="button" className="btn btn-primary"
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  onClick={resolveDriveLink}>
                  Use Link
                </button>
              </div>
              {driveResolved ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.4rem' }}>
                  ✓ Drive link resolved. File must be set to &quot;Anyone with link can view&quot;.
                </p>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                  Formats: drive.google.com/file/d/FILE_ID/view or open?id=FILE_ID
                </p>
              )}
              {driveResolved && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input type="radio" checked={mediaType === 'image'} onChange={() => setMediaType('image')} /> Image
                  </label>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input type="radio" checked={mediaType === 'video'} onChange={() => setMediaType('video')} /> Video / Reel
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Media Preview */}
          {mediaPreview && mediaTab === 'upload' && (
            <div className="media-preview-box">
              {mediaType === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaPreview} alt="Preview" />
              ) : (
                <video src={mediaPreview} controls />
              )}
              <button type="button" onClick={removeMedia} className="media-remove-btn" title="Remove">
                <X size={16} />
              </button>
            </div>
          )}

          {mediaFile && (
            <p className="form-helper" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
              {mediaType === 'video' ? <Film size={12} /> : <FileImage size={12} />}
              {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
              {isUploading && <span style={{ color: 'var(--warning)' }}>— Uploading...</span>}
              {uploadedUrl && !isUploading && <span style={{ color: 'var(--success)' }}>— ✓ Uploaded</span>}
            </p>
          )}
        </div>

        {/* ======== TITLE ======== */}
        <div className="form-group">
          <label className="form-label">Title</label>
          <input type="text" placeholder="e.g. Summer Campaign Launch" className="form-input"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* ======== CAPTION ======== */}
        <div className="form-group">
          <label className="form-label">Caption</label>
          <textarea placeholder="Write your caption, hashtags, and call to action..." className="form-textarea"
            value={caption} onChange={e => setCaption(e.target.value)} rows={4} />
        </div>

        {/* ======== DESCRIPTION / NOTES ======== */}
        <div className="form-group">
          <label className="form-label">Notes / YouTube Description</label>
          <textarea placeholder="Internal notes or YouTube video description..." className="form-textarea"
            value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        </div>

        {/* ======== SCHEDULE TIMES (only when schedule action) ======== */}
        {action === 'schedule' && (
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Schedule Times</label>
              <button type="button" className="btn btn-secondary"
                style={{ padding: '0.25rem 0.7rem', fontSize: '0.75rem', gap: '0.35rem' }}
                onClick={addScheduleTime}>
                <Plus size={13} /> Add Another Time
              </button>
            </div>
            {scheduleTimes.map((t, i) => (
              <div key={i} className="schedule-time-item">
                <div className="schedule-time-num">{i + 1}</div>
                <input type="datetime-local" className="form-input" style={{ flex: 1 }}
                  value={t} onChange={e => updateScheduleTime(i, e.target.value)} required />
                {scheduleTimes.length > 1 && (
                  <button type="button" className="btn-icon-danger" onClick={() => removeScheduleTime(i)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <p className="form-helper">
              <Clock size={11} style={{ display: 'inline', marginRight: '0.3rem' }} />
              Will create {selectedAccounts.size * scheduleTimes.length} total post{selectedAccounts.size * scheduleTimes.length !== 1 ? 's' : ''}
              ({selectedAccounts.size} account{selectedAccounts.size !== 1 ? 's' : ''} × {scheduleTimes.length} time{scheduleTimes.length !== 1 ? 's' : ''})
            </p>
          </div>
        )}

        {/* ======== ACTION BUTTONS ======== */}
        <div className="action-buttons-row">
          <button type="button" className="btn btn-secondary"
            onClick={() => router.push('/status')}>
            Cancel
          </button>

          <button type="button" className="btn btn-draft"
            disabled={isSubmitting || isUploading}
            onClick={() => { setAction('draft'); handleSubmit('draft'); }}>
            <FileImage size={15} />
            <span>Save Draft</span>
          </button>

          <button type="button" className="btn btn-schedule"
            disabled={isSubmitting || isUploading}
            onClick={() => { setAction('schedule'); }}>
            <Calendar size={15} />
            <span>Schedule</span>
          </button>

          {action === 'schedule' && (
            <button type="button" className="btn btn-primary"
              disabled={isSubmitting || isUploading}
              onClick={() => handleSubmit('schedule')}>
              <Check size={15} />
              <span>
                {isSubmitting ? 'Saving...' : `Confirm Schedule${scheduleTimes.length > 1 ? ` (${scheduleTimes.length} times)` : ''}`}
              </span>
            </button>
          )}

          {action !== 'schedule' && (
            <button type="button" className="btn btn-success"
              disabled={isSubmitting || isUploading}
              onClick={() => { setAction('draft'); handleSubmit('publish'); }}>
              <Send size={15} />
              <span>
                {isSubmitting ? 'Publishing...' : `Publish Now${selectedAccounts.size > 1 ? ` (${selectedAccounts.size})` : ''}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
