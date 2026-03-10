import React from 'react';

export default function ClassMarkerLogo({ size = 48, transparent = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#00DDB3" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="leftLegGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="rightLegGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#00DDB3" />
        </linearGradient>
        <filter id="foldShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="-2" dy="6" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
        </filter>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Conditionally render the dark background box */}
      {!transparent && <rect width="256" height="256" rx="60" fill="url(#bgGrad)" />}

      <circle cx="128" cy="128" r="96" fill="none" stroke="url(#gridGrad)" strokeWidth="2" />
      <circle cx="128" cy="128" r="64" fill="none" stroke="url(#gridGrad)" strokeWidth="1" strokeDasharray="4 6" />

      <path d="M 56 180 L 92 108 L 140 172 L 200 76" fill="none" stroke="#00DDB3" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" filter="url(#glow)" />
      
      <path d="M 56 180 L 92 108 L 128 156" fill="none" stroke="url(#leftLegGrad)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 104 124 L 140 172 L 200 76" fill="none" stroke="url(#rightLegGrad)" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" filter="url(#foldShadow)" />
      
      <circle cx="200" cy="76" r="6" fill="#FFFFFF" filter="url(#glow)" />
    </svg>
  );
}