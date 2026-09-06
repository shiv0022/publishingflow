'use client';

import React from 'react';
import { Platform } from '@/types';
import { InstagramIcon, FacebookIcon, YouTubeIcon } from './PlatformIcons';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md';
}

export function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const iconSize = size === 'sm' ? 13 : 15;

  const renderIcon = () => {
    switch (platform) {
      case 'Instagram':
        return <InstagramIcon size={iconSize} />;
      case 'Facebook':
        return <FacebookIcon size={iconSize} />;
      case 'YouTube':
        return <YouTubeIcon size={iconSize} />;
    }
  };

  return (
    <span className={`platform-badge ${platform}`}>
      {renderIcon()}
      <span>{platform}</span>
    </span>
  );
}
