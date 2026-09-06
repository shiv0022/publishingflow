'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Platform } from '@/types';
import { InstagramIcon, FacebookIcon, YouTubeIcon } from '@/components/PlatformIcons';
import { 
  UploadCloud, 
  X, 
  Send, 
  Calendar,
  FileImage,
  Film,
  Sparkles
} from 'lucide-react';

const PLATFORMS: { id: Platform; label: string; icon: React.ReactNode }[] = [
  { id: 'Instagram', label: 'Instagram', icon: <InstagramIcon size={18} /> },
  { id: 'Facebook', label: 'Facebook', icon: <FacebookIcon size={18} /> },
  { id: 'YouTube', label: 'YouTube', icon: <YouTubeIcon size={18} /> },
];

export default function CreatePostPage() {
  const router = useRouter();
  const { accounts, addPost } = useApp();

  // Form states
  const [selectedClient, setSelectedClient] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  
  // Media upload state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timing mode: "now" -> draft | "schedule" -> scheduled
  const [timingMode, setTimingMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  // Default client selection on load or changes
  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedClient) {
        setSelectedClient(accounts[0].clientName);
        setPlatform(accounts[0].platform);
      }
    } else {
      setSelectedClient('__custom__');
    }
  }, [accounts, selectedClient]);

  // When client changes from select, auto-align platform with that account if available
  const handleClientChange = (val: string) => {
    setSelectedClient(val);
    const matched = accounts.find((a) => a.clientName === val);
    if (matched) {
      setPlatform(matched.platform);
    }
  };

  // Set default schedule date to tomorrow at 10:00 AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tzOffset = tomorrow.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
  }, []);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    const isVid = file.type.startsWith('video');
    setMediaType(isVid ? 'video' : 'image');

    // For images under 3MB, read as Data URL so preview persists in localStorage
    if (!isVid && file.size < 3 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      const objectUrl = URL.createObjectURL(file);
      setMediaPreview(objectUrl);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalClientName = selectedClient === '__custom__' 
      ? customClientName.trim() 
      : selectedClient.trim();

    if (!finalClientName) {
      alert('Please select or specify a client name.');
      return;
    }

    if (!caption.trim() && !title.trim()) {
      alert('Please provide at least a title or caption for the post.');
      return;
    }

    if (timingMode === 'schedule' && !scheduledAt) {
      alert('Please select a scheduled date and time.');
      return;
    }

    // Determine status: "now" saves as "draft", "schedule" saves as "scheduled"
    const isScheduled = timingMode === 'schedule';
    const status = isScheduled ? 'scheduled' : 'draft';

    addPost({
      clientName: finalClientName,
      platform,
      title: title.trim(),
      caption: caption.trim(),
      description: description.trim(),
      mediaUrl: mediaPreview || undefined,
      mediaType: mediaPreview ? mediaType : undefined,
      mediaName: mediaFile?.name || (mediaPreview ? 'attached-media' : undefined),
      isScheduled,
      scheduledAt: isScheduled ? scheduledAt : undefined,
      status,
    });

    // Navigate to status page
    router.push('/status?created=true');
  };

  return (
    <div className="main-content" style={{ maxWidth: '780px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Post</h1>
          <p className="page-subtitle">
            Draft or schedule content for Instagram, Facebook, or YouTube.
          </p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Client Select */}
          <div className="form-group">
            <label className="form-label">Client</label>
            <select
              className="form-select"
              value={selectedClient}
              onChange={(e) => handleClientChange(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.clientName}>
                  {acc.clientName} ({acc.platform} • {acc.connectionType})
                </option>
              ))}
              <option value="__custom__">+ Enter Custom Client Name</option>
            </select>

            {selectedClient === '__custom__' && (
              <div style={{ marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Enter client or brand name"
                  className="form-input"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}
            <p className="form-helper">
              Select an existing client account or enter a new client name.
            </p>
          </div>

          {/* Platform Select */}
          <div className="form-group">
            <label className="form-label">Target Platform</label>
            <div className="platform-options">
              {PLATFORMS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPlatform(item.id)}
                  className={`platform-card-btn ${
                    platform === item.id ? `active-${item.id}` : ''
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <p className="form-helper">
              Platforms limited to Instagram, Facebook, and YouTube.
            </p>
          </div>

          {/* Media Upload */}
          <div className="form-group">
            <label className="form-label">Media (Image or Video)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleMediaUpload}
            />

            {!mediaPreview ? (
              <div
                className="media-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={32} style={{ color: '#94a3b8', margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Click to select an Image or Video
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Supports JPG, PNG, MP4, MOV. Instant local preview.
                </p>
              </div>
            ) : (
              <div className="media-preview-box">
                {mediaType === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaPreview} alt="Upload preview" />
                ) : (
                  <video src={mediaPreview} controls />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="media-remove-btn"
                  title="Remove media"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {mediaFile && (
              <p className="form-helper" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {mediaType === 'video' ? <Film size={12} /> : <FileImage size={12} />}
                {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Manual Title */}
          <div className="form-group">
            <label className="form-label">Manual Title</label>
            <input
              type="text"
              placeholder="e.g. Summer Promo Launch Video"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="form-helper">Headline or internal title for the post.</p>
          </div>

          {/* Manual Caption */}
          <div className="form-group">
            <label className="form-label">Manual Caption</label>
            <textarea
              placeholder="Write the social media post caption, hashtags, and call to action..."
              className="form-textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>

          {/* Manual Description */}
          <div className="form-group">
            <label className="form-label">Manual Description / Internal Notes</label>
            <textarea
              placeholder="Additional post notes, YouTube description snippet, or client briefing notes..."
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Post Now or Schedule Toggle */}
          <div className="form-group">
            <label className="form-label">Publishing Schedule</label>
            <div className="timing-toggle">
              <button
                type="button"
                className={`timing-tab ${timingMode === 'now' ? 'active' : ''}`}
                onClick={() => setTimingMode('now')}
              >
                <Send size={15} />
                <span>Post Now (Save as Draft)</span>
              </button>

              <button
                type="button"
                className={`timing-tab ${timingMode === 'schedule' ? 'active' : ''}`}
                onClick={() => setTimingMode('schedule')}
              >
                <Calendar size={15} />
                <span>Schedule with Date & Time</span>
              </button>
            </div>

            {timingMode === 'schedule' && (
              <div style={{ marginTop: '0.85rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Select Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required={timingMode === 'schedule'}
                />
              </div>
            )}
            <p className="form-helper">
              {timingMode === 'now'
                ? 'Will save post with status "draft".'
                : 'Will save post with status "scheduled" at the specified date & time.'}
            </p>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '160px' }}>
              {timingMode === 'schedule' ? <Calendar size={15} /> : <Send size={15} />}
              <span>{timingMode === 'schedule' ? 'Schedule Post' : 'Save Post (Draft)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
