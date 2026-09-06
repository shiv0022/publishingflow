'use client';

import React from 'react';
import { FileText, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { PostStatus } from '@/types';

interface StatusBadgeProps {
  status: PostStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const renderIcon = () => {
    switch (status) {
      case 'draft':
        return <FileText size={12} />;
      case 'scheduled':
        return <Calendar size={12} />;
      case 'posted':
        return <CheckCircle2 size={12} />;
      case 'failed':
        return <AlertCircle size={12} />;
    }
  };

  return (
    <span className={`status-badge ${status}`}>
      {renderIcon()}
      <span>{status}</span>
    </span>
  );
}
