import React from 'react';

export function InstagramIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function YouTubeIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MetaIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M6.915 4.006c-2.342 0-4.33 1.34-5.352 3.434C.55 9.49.5 11.758 1.417 13.79c.928 2.054 2.66 3.738 4.774 4.64 1.597.68 3.336.782 4.96.29 1.488-.45 2.813-1.39 3.849-2.705 1.036 1.314 2.361 2.254 3.85 2.704 1.623.493 3.362.39 4.959-.29 2.114-.902 3.846-2.586 4.774-4.64.917-2.032.867-4.3-.146-6.35-.97-1.974-2.775-3.414-4.968-3.797-1.428-.25-2.895-.084-4.225.48-1.536.65-2.83 1.802-3.793 3.29-.963-1.488-2.257-2.64-3.793-3.29-1.33-.564-2.797-.73-4.225-.48-.48.084-.954.21-1.417.373zm-2.04 6.732c.575-1.554 1.824-2.58 3.242-2.58 1.88 0 3.334 1.767 4.148 3.75-1.047 1.832-2.353 3.123-3.832 3.123-1.57 0-2.86-1.543-3.558-4.293zm9.63 1.17c.814-1.983 2.268-3.75 4.148-3.75 1.418 0 2.667 1.026 3.242 2.58-.698 2.75-1.988 4.293-3.558 4.293-1.479 0-2.785-1.29-3.832-3.123z" />
    </svg>
  );
}

export function FacebookFilledIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#1877F2"
      className={className}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

