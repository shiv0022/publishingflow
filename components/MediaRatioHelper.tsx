'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Platform } from '@/types';
import { CheckCircle2, AlertTriangle, Crop, Sparkles, RefreshCw, Info } from 'lucide-react';

interface MediaRatioHelperProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  selectedPlatforms: Platform[];
  onMediaFitted?: (fittedFile: File, fittedPreviewUrl: string) => void;
  originalFile?: File | null;
}

export interface MediaDimensions {
  width: number;
  height: number;
  ratio: number;
  ratioLabel: string;
}

export function calculateRatioLabel(width: number, height: number): { ratio: number; label: string; tag: string } {
  if (!width || !height) return { ratio: 1, label: 'Unknown', tag: 'default' };
  const r = width / height;

  if (Math.abs(r - 1.0) < 0.05) {
    return { ratio: r, label: '1:1 Square', tag: '1:1' };
  } else if (Math.abs(r - 0.8) < 0.05) {
    return { ratio: r, label: '4:5 Portrait (IG Feed Ideal)', tag: '4:5' };
  } else if (Math.abs(r - 0.5625) < 0.05) {
    return { ratio: r, label: '9:16 Vertical (Reels / Shorts)', tag: '9:16' };
  } else if (Math.abs(r - 1.777) < 0.05) {
    return { ratio: r, label: '16:9 Landscape (YouTube / FB)', tag: '16:9' };
  } else if (Math.abs(r - 1.91) < 0.06) {
    return { ratio: r, label: '1.91:1 Landscape (IG / FB)', tag: '1.91:1' };
  } else if (r < 0.8) {
    return { ratio: r, label: `${r.toFixed(2)}:1 (Too Tall for IG Feed)`, tag: 'tall' };
  } else if (r > 1.91) {
    return { ratio: r, label: `${r.toFixed(2)}:1 (Too Wide for IG Feed)`, tag: 'wide' };
  } else {
    return { ratio: r, label: `${r.toFixed(2)}:1 Custom`, tag: 'custom' };
  }
}

export function MediaRatioHelper({
  mediaUrl,
  mediaType,
  selectedPlatforms,
  onMediaFitted,
  originalFile,
}: MediaRatioHelperProps) {
  const [dimensions, setDimensions] = useState<MediaDimensions | null>(null);
  const [isFitting, setIsFitting] = useState(false);
  const [fittedApplied, setFittedApplied] = useState<string | null>(null);

  // Measure dimensions
  useEffect(() => {
    if (!mediaUrl) {
      setDimensions(null);
      return;
    }

    if (mediaType === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const { ratio, label } = calculateRatioLabel(img.naturalWidth, img.naturalHeight);
        setDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight,
          ratio,
          ratioLabel: label,
        });
      };
      img.src = mediaUrl;
    } else {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.onloadedmetadata = () => {
        const { ratio, label } = calculateRatioLabel(video.videoWidth, video.videoHeight);
        setDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
          ratio,
          ratioLabel: label,
        });
      };
      video.src = mediaUrl;
    }
  }, [mediaUrl, mediaType]);

  // Compatibility Checks
  const hasInstagram = selectedPlatforms.includes('Instagram');
  const isImage = mediaType === 'image';
  const isVideo = mediaType === 'video';

  // Instagram Feed Image Rule: Ratio must be between 4:5 (0.80) and 1.91:1 (1.91)
  const isInstagramImageMismatched = Boolean(
    hasInstagram &&
    isImage &&
    dimensions &&
    (dimensions.ratio < 0.79 || dimensions.ratio > 1.92)
  );

  // Instagram Video Recommendation: Best is 9:16 for Reels or 4:5 / 16:9
  const isInstagramVideoWarning = Boolean(
    hasInstagram &&
    isVideo &&
    dimensions &&
    dimensions.ratio > 1.0 &&
    dimensions.ratio < 1.7
  );

  // In-Browser Canvas Quick Fit (Auto-Fit to 1:1 or 4:5 without quality loss)
  const applyQuickFit = async (targetRatio: '1:1' | '4:5') => {
    if (!mediaUrl || mediaType !== 'image' || !onMediaFitted) return;
    setIsFitting(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = mediaUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      let targetW = 1080;
      let targetH = 1080;

      if (targetRatio === '4:5') {
        targetW = 1080;
        targetH = 1350;
      }

      canvas.width = targetW;
      canvas.height = targetH;

      // Fill canvas background with clean modern subtle tone
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetW, targetH);

      // Create subtle blurred background for professional look
      ctx.save();
      ctx.filter = 'blur(30px) brightness(0.6)';
      ctx.drawImage(img, -20, -20, targetW + 40, targetH + 40);
      ctx.restore();

      // Fit original image centered inside target aspect ratio
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const targetCanvasRatio = targetW / targetH;

      let drawW = targetW;
      let drawH = targetH;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > targetCanvasRatio) {
        // Image is wider: fit width
        drawW = targetW;
        drawH = targetW / imgRatio;
        drawY = (targetH - drawH) / 2;
      } else {
        // Image is taller: fit height
        drawH = targetH;
        drawW = targetH * imgRatio;
        drawX = (targetW - drawW) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Convert to blob & File
      canvas.toBlob((blob) => {
        if (!blob) return;
        const filename = (originalFile?.name || 'fitted-post').replace(/\.[^/.]+$/, '') + `_${targetRatio.replace(':', '-')}.jpg`;
        const newFile = new File([blob], filename, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);

        onMediaFitted(newFile, previewUrl);
        setFittedApplied(targetRatio);
        setIsFitting(false);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Canvas fit error:', err);
      setIsFitting(false);
    }
  };

  if (!dimensions) return null;

  return (
    <div className="media-ratio-container" style={{ marginTop: '0.75rem' }}>
      {/* Ratio & Dimension Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="badge-ratio" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.6rem',
          borderRadius: '6px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-main)',
        }}>
          <Crop size={12} style={{ color: 'var(--primary)' }} />
          <span>{dimensions.ratioLabel}</span>
        </span>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {dimensions.width} × {dimensions.height} px
        </span>

        {/* Status Indicator */}
        {isInstagramImageMismatched ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.75rem',
            color: 'var(--danger)',
            fontWeight: 600,
            background: 'var(--danger-light)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <AlertTriangle size={12} />
            <span>Ratio mismatch for Instagram</span>
          </span>
        ) : (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.75rem',
            color: 'var(--success)',
            fontWeight: 500,
            background: 'var(--success-light)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px'
          }}>
            <CheckCircle2 size={12} />
            <span>Compatible with selected platforms</span>
          </span>
        )}
      </div>

      {/* Warning Box for Instagram Feed Mismatch */}
      {isInstagramImageMismatched && (
        <div style={{
          marginTop: '0.6rem',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '0.75rem',
          fontSize: '0.82rem',
          color: '#92400e',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                Instagram Feed Aspect Ratio Warning
              </p>
              <p style={{ lineHeight: 1.4 }}>
                Instagram Graph API will reject feed photos outside <strong>4:5 (0.80)</strong> and <strong>1.91:1</strong>.
                Current ratio is <strong>{dimensions.ratio.toFixed(2)}:1</strong>.
              </p>
              
              {/* 1-Click Quick Fit Buttons */}
              {isImage && onMediaFitted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#78350f' }}>1-Click Auto Fit:</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.35rem' }}
                    onClick={() => applyQuickFit('1:1')}
                    disabled={isFitting}
                  >
                    <Sparkles size={12} color="var(--primary)" />
                    <span>Fit to 1:1 Square (Safe for All)</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.35rem' }}
                    onClick={() => applyQuickFit('4:5')}
                    disabled={isFitting}
                  >
                    <Crop size={12} color="var(--accent-purple)" />
                    <span>Fit to 4:5 Portrait (Best for IG)</span>
                  </button>

                  {isFitting && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <RefreshCw size={12} className="animate-spin" /> Adjusting...
                    </span>
                  )}
                  {fittedApplied && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                      ✓ Applied {fittedApplied} Fit!
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Reel note */}
      {isInstagramVideoWarning && (
        <div style={{
          marginTop: '0.5rem',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Info size={14} color="var(--primary)" />
          <span>Note: Instagram Reels perform best with <strong>9:16 vertical video</strong> (1080 × 1920 px).</span>
        </div>
      )}
    </div>
  );
}
