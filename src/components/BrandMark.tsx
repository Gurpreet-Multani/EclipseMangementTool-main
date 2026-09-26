import React from 'react';

interface BrandMarkProps {
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 220 220"
      className={className}
      role="img"
      aria-label="Eclipse wolf brand mark"
    >
      <defs>
        <linearGradient id="bronzeRing" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#e8c39f" />
          <stop offset="30%" stopColor="#b56e3f" />
          <stop offset="60%" stopColor="#8b4d2d" />
          <stop offset="100%" stopColor="#f2d0a4" />
        </linearGradient>
        <linearGradient id="wolfMetal" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#d6a06b" />
          <stop offset="25%" stopColor="#b77143" />
          <stop offset="50%" stopColor="#8c4a2a" />
          <stop offset="100%" stopColor="#d9b07b" />
        </linearGradient>
        <radialGradient id="wolfShadow" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#f4d8b1" stopOpacity="0.9" />
          <stop offset="28%" stopColor="#b77143" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#5e2f1f" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#2b1a17" stopOpacity="1" />
        </radialGradient>
      </defs>

      <circle cx="110" cy="110" r="97" fill="none" stroke="url(#bronzeRing)" strokeWidth="6" />
      <circle cx="110" cy="110" r="82" fill="none" stroke="url(#bronzeRing)" strokeWidth="2" opacity="0.9" />

      <g opacity="0.85" stroke="url(#bronzeRing)" strokeLinecap="round" fill="none">
        <path d="M110 18V38" strokeWidth="2" />
        <path d="M110 202V182" strokeWidth="2" />
        <path d="M18 110H38" strokeWidth="2" />
        <path d="M202 110H182" strokeWidth="2" />
        <path d="M36 36L48 48" strokeWidth="2" />
        <path d="M184 184L172 172" strokeWidth="2" />
        <path d="M36 184L48 172" strokeWidth="2" />
        <path d="M184 36L172 48" strokeWidth="2" />
      </g>

      <g opacity="0.9" fill="url(#bronzeRing)">
        <circle cx="48" cy="110" r="4" />
        <circle cx="172" cy="110" r="4" />
        <circle cx="110" cy="38" r="4" />
        <circle cx="110" cy="182" r="4" />
      </g>

      <g transform="translate(8 8)">
        <polygon points="110,36 65,72 72,94 106,81 94,118 106,151 78,181 110,171 142,181 114,151 126,118 114,81 148,94 155,72" fill="url(#wolfShadow)" stroke="url(#bronzeRing)" strokeWidth="3" strokeLinejoin="round" />
        <polygon points="110,38 82,70 75,58 96,44" fill="rgba(255,255,255,0.12)" />
        <polygon points="110,38 138,70 145,58 124,44" fill="rgba(0,0,0,0.18)" />

        <path d="M80 118L92 129L76 155L60 144L80 118Z" fill="url(#wolfMetal)" stroke="url(#bronzeRing)" strokeWidth="2" />
        <path d="M140 118L128 129L144 155L160 144L140 118Z" fill="url(#wolfMetal)" stroke="url(#bronzeRing)" strokeWidth="2" />

        <path d="M95 125L110 136L125 125L132 150L110 170L88 150Z" fill="url(#wolfShadow)" stroke="url(#bronzeRing)" strokeWidth="2.5" />
        <path d="M88 150L75 154L70 168L92 168L99 158Z" fill="url(#wolfMetal)" stroke="url(#bronzeRing)" strokeWidth="2" />
        <path d="M132 150L145 154L150 168L128 168L121 158Z" fill="url(#wolfMetal)" stroke="url(#bronzeRing)" strokeWidth="2" />

        <path d="M82 90L69 100L52 89L60 108L74 118L88 101Z" fill="url(#wolfMetal)" stroke="url(#bronzeRing)" strokeWidth="2" />
        <path d="M138 90L151 100L168 89L160 108L146 118L132 101Z" fill="url(#wolfMetal)" stroke="url(#bronzeRing)" strokeWidth="2" />

        <path d="M110 85L98 98L104 114L110 121L116 114L122 98Z" fill="url(#wolfMetal)" stroke="url(#bronzeRing)" strokeWidth="2" />

        <path d="M78 118L62 133L62 145L79 142L90 129Z" fill="rgba(21,12,9,0.22)" />
        <path d="M142 118L158 133L158 145L141 142L130 129Z" fill="rgba(21,12,9,0.22)" />

        <g fill="rgba(255,255,255,0.22)">
          <polygon points="104,82 110,91 116,82 110,76" />
          <polygon points="92,100 103,109 95,119 83,110" />
          <polygon points="128,100 117,109 125,119 137,110" />
        </g>
      </g>
    </svg>
  );
};
