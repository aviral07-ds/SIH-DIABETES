import React from 'react';

export default function DrishtiLogo({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="drishtiGradPrimary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="drishtiGradGlow" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <radialGradient id="drishtiIrisCenter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F0FDFA" />
          <stop offset="60%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </radialGradient>
      </defs>

      {/* Outer Reticle Aperture */}
      <circle cx="24" cy="24" r="21" stroke="url(#drishtiGradPrimary)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 2" opacity="0.4" />
      
      {/* Outer Scanning Retinal Contour */}
      <path 
        d="M6 24C10.5 14.5 17 9.5 24 9.5C31 9.5 37.5 14.5 42 24C37.5 33.5 31 38.5 24 38.5C17 38.5 10.5 33.5 6 24Z" 
        stroke="url(#drishtiGradPrimary)" 
        strokeWidth="3.2" 
        strokeLinejoin="round"
      />

      {/* Iris Ring */}
      <circle cx="24" cy="24" r="9.5" stroke="url(#drishtiGradGlow)" strokeWidth="2.2" />

      {/* Central Optic Disc / Pupil with AI Focal Core */}
      <circle cx="24" cy="24" r="5" fill="url(#drishtiIrisCenter)" />

      {/* Neural AI Crosshair / Optical Alignment Nodes */}
      <line x1="24" y1="7" x2="24" y2="12" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="36" x2="24" y2="41" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="24" x2="12" y2="24" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="24" x2="41" y2="24" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

      {/* Diagonal Neural Focus Sparkle */}
      <circle cx="26.5" cy="21.5" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}
