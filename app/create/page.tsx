'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Platform } from '@/types';
import { AccountRecipientPicker } from '@/components/AccountRecipientPicker';
import { MediaRatioHelper } from '@/components/MediaRatioHelper';
import {
  UploadCloud, X, Send, Calendar, FileImage, Film,
  Plus, Trash2, Link, Check, Clock, AlertCircle, Sparkles
} from 'lucide-react';

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

export default function CreatePostPage() {
  const router = useRouter();
  const { accounts, addPost, refreshData } = useApp();

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Default schedule date (tomorrow 10AM local time)
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

  // Recipient Handlers
  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllConnected = () => {
    const connected = accounts.filter(a => a.connectionStatus === 'Connected').map(a => a.id);
    setSelectedAccounts(new Set(connected));
  };

  const clearAllAccounts = () => {
    setSelectedAccounts(new Set());
  };

  const selectPlatformOnly = (platform: Platform) => {
    const platformAccIds = accounts
      .filter(a => a.platform === platform && a.connectionStatus === 'Connected')
      .map(a => a.id);

    setSelectedAccounts(prev => {
      const hasAll = platformAccIds.every(id => prev.has(id));
      const n = new Set(prev);
      if (hasAll) {
        platformAccIds.forEach(id => n.delete(id));
      } else {
        platformAccIds.forEach(id => n.add(id));
      }
      return n;
    });
  };

  // Media upload handler
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

  // Handle media fitted from MediaRatioHelper Canvas tool
  const handleMediaFitted = async (fittedFile: File, fittedPreviewUrl: string) => {
    setMediaFile(fittedFile);
    setMediaPreview(fittedPreviewUrl);
    setUploadedUrl('');
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', fittedFile);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setUploadedUrl(data.url);
    } catch (err) {
      console.error('Fitted upload error:', err);
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
    if (!id) {
      alert('Invalid Google Drive link. Make sure to share the file with "Anyone with link can view".');
      return;
    }
    const url = getDriveDirectUrl(id);
    setDriveResolved(url);
    setUploadedUrl(url);
    setMediaType('image');
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

  // Submit Handler: Supports Draft, Schedule, and Direct Real Publish
  const handleSubmit = async (submitAction: 'publish' | 'draft' | 'schedule') => {
    setSubmitError(null);

    if (selectedAccounts.size === 0) {
      setSubmitError('Please select at least one account to post to.');
      return;
    }
    if (!caption.trim() && !title.trim()) {
      setSubmitError('Please enter a caption or title for the post.');
      return;
    }
    if (submitAction === 'schedule' && scheduleTimes.some(t => !t)) {
      setSubmitError('Please fill in valid dates and times for scheduling.');
      return;
    }

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
      const createdPosts = [];

      for (const acc of selectedAccountsList) {
        for (const rawSchedTime of timesToCreate) {
          // Normalize to UTC ISO string
          const normalizedScheduledAt = rawSchedTime ? new Date(rawSchedTime).toISOString() : undefined;

          const created = await addPost({
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
            scheduledAt: normalizedScheduledAt,
            status: submitAction === 'schedule' ? 'scheduled' : 'draft',
          });
          createdPosts.push(created);
        }
      }

      // If user clicked "Publish Now", trigger immediate execution for OAuth accounts
      if (submitAction === 'publish') {
        const publishPromises = createdPosts.map(async (p) => {
          try {
            const res = await fetch('/api/publish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postId: p.id }),
            });
            return await res.json();
          } catch (e) {
            return { error: 'Network error publishing' };
          }
        });

        await Promise.all(publishPromises);
        await refreshData();
        router.push('/status?published=true');
        return;
      }

      // If scheduled, refresh data and route to status
      await refreshData();
      router.push('/status?created=true');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selected platforms list for aspect ratio validation
  const selectedPlatformsList = Array.from(
    new Set(accounts.filter(a => selectedAccounts.has(a.id)).map(a => a.platform))
  );

  const totalPosts = selectedAccounts.size * (action === 'schedule' ? scheduleTimes.length : 1);

  return (
    <div className="main-content" style={{ maxWidth: '850px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Post</h1>
          <p className="page-subtitle">Publish or schedule content across multiple platforms at once.</p>
        </div>
      </div>

      {submitError && (
        <div style={{
          background: 'var(--danger-light)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} />
          <span>{submitError}</span>
        </div>
      )}

      <div className="card">
        {/* ======== 1. EMAIL-STYLE ACCOUNT RECIPIENT SELECTOR ======== */}
        <div className="form-group">
          <AccountRecipientPicker
            accounts={accounts}
            selectedAccountIds={selectedAccounts}
            onToggleAccount={toggleAccount}
            onSelectAllConnected={selectAllConnected}
            onClearAll={clearAllAccounts}
            onSelectPlatformOnly={selectPlatformOnly}
          />
        </div>

        {/* ======== 2. MEDIA WITH ASPECT RATIO DETECTION & FIT TOOL ======== */}
        <div className="form-group">
          <label className="form-label">Media (Image or Video)</label>

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

          {/* Upload Dropzone */}
          {mediaTab === 'upload' && !mediaPreview && (
            <div className="media-dropzone" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Click to upload Image or Video</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>JPG, PNG, MP4, MOV — automatically checks ratio compatibility</p>
            </div>
          )}

          {/* URL Tab */}
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
            </div>
          )}

          {/* Google Drive Tab */}
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
              {driveResolved && (
                <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.4rem' }}>
                  ✓ Drive link resolved. File must be set to &quot;Anyone with link can view&quot;.
                </p>
              )}
            </div>
          )}

          {/* Media Preview Box */}
          {mediaPreview && (
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

          {/* Aspect Ratio Helper, Compatibility Warning & 1-Click Fit */}
          {mediaPreview && (
            <MediaRatioHelper
              mediaUrl={mediaPreview}
              mediaType={mediaType}
              selectedPlatforms={selectedPlatformsList}
              onMediaFitted={handleMediaFitted}
              originalFile={mediaFile}
            />
          )}

          {mediaFile && (
            <p className="form-helper" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
              {mediaType === 'video' ? <Film size={12} /> : <FileImage size={12} />}
              {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
              {isUploading && <span style={{ color: 'var(--warning)' }}>— Uploading...</span>}
              {uploadedUrl && !isUploading && <span style={{ color: 'var(--success)' }}>— ✓ Ready</span>}
            </p>
          )}
        </div>

        {/* ======== 3. TITLE ======== */}
        <div className="form-group">
          <label className="form-label">Post Title (Optional for Facebook / YouTube)</label>
          <input type="text" placeholder="e.g. Summer Special Announcement" className="form-input"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* ======== 4. CAPTION ======== */}
        <div className="form-group">
          <label className="form-label">Caption & Hashtags</label>
          <textarea placeholder="Write your caption, hashtags, and call to action..." className="form-textarea"
            value={caption} onChange={e => setCaption(e.target.value)} rows={4} />
        </div>

        {/* ======== 5. DESCRIPTION / NOTES ======== */}
        <div className="form-group">
          <label className="form-label">Notes / YouTube Description</label>
          <textarea placeholder="Internal notes or YouTube video description..." className="form-textarea"
            value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        </div>

        {/* ======== 6. SCHEDULE TIMES ======== */}
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
              Will schedule {selectedAccounts.size * scheduleTimes.length} total post(s)
              ({selectedAccounts.size} account(s) × {scheduleTimes.length} time(s))
            </p>
          </div>
        )}

        {/* ======== 7. ACTION BUTTONS ======== */}
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

          <button type="button" className={`btn ${action === 'schedule' ? 'btn-primary' : 'btn-schedule'}`}
            disabled={isSubmitting || isUploading}
            onClick={() => { setAction(action === 'schedule' ? 'draft' : 'schedule'); }}>
            <Calendar size={15} />
            <span>{action === 'schedule' ? 'Schedule Mode Active' : 'Schedule'}</span>
          </button>

          {action === 'schedule' ? (
            <button type="button" className="btn btn-primary"
              disabled={isSubmitting || isUploading || selectedAccounts.size === 0}
              onClick={() => handleSubmit('schedule')}>
              <Check size={15} />
              <span>
                {isSubmitting ? 'Scheduling...' : `Confirm Schedule (${selectedAccounts.size} account${selectedAccounts.size !== 1 ? 's' : ''})`}
              </span>
            </button>
          ) : (
            <button type="button" className="btn btn-success"
              disabled={isSubmitting || isUploading || selectedAccounts.size === 0}
              onClick={() => handleSubmit('publish')}>
              <Send size={15} />
              <span>
                {isSubmitting ? 'Publishing...' : `Publish Now (${selectedAccounts.size})`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
