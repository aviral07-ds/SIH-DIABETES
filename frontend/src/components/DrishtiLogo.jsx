import React from 'react';

/**
 * DrishtiLogo component
 * Renders the official Drishti Care retinal eye brandmark with fundus vasculature & optic disc.
 * Supports custom sizes and optional inline styling.
 */
export default function DrishtiLogo({ size = 32, className = '' }) {
  return (
    <img 
      src="/drishti-logo.png" 
      alt="Drishti Care Logo" 
      width={size} 
      height={Math.round(size * (297 / 448))} 
      className={`inline-block object-contain select-none shrink-0 ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
