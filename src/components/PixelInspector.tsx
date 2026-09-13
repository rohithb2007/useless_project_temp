import React from 'react';

export type InspectorState = 'NORMAL' | 'SCANNING' | 'SHOCKED' | 'HAPPY' | 'CONFUSED';

interface PixelInspectorProps {
  state?: InspectorState;
  className?: string;
  size?: number;
}

export const PixelInspector: React.FC<PixelInspectorProps> = ({
  state = 'NORMAL',
  className = '',
  size = 96,
}) => {
  // SVG Pixel art matrix rendering of 8-bit Malayalam Inspector character
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full animate-pixel-bounce"
        style={{ imageRendering: 'pixelated' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="16" cy="30" rx="10" ry="2" fill="#000000" opacity="0.5" />

        {/* POLICE CAP */}
        {/* Cap Base */}
        <rect x="8" y="4" width="16" height="5" fill="#1e293b" />
        <rect x="6" y="7" width="20" height="2" fill="#0f172a" />
        {/* Gold Cap Badge */}
        <rect x="14" y="5" width="4" height="3" fill="#eab308" />
        <rect x="15" y="6" width="2" height="1" fill="#fef08a" />
        {/* Cap Visor / Peak */}
        <rect x="5" y="9" width="22" height="2" fill="#020617" />

        {/* FACE SKIN */}
        <rect x="9" y="11" width="14" height="11" fill="#f59e0b" />
        <rect x="8" y="12" width="1" height="8" fill="#d97706" />
        <rect x="23" y="12" width="1" height="8" fill="#d97706" />

        {/* EYES & SUNGLASSES / EXPRESSIONS */}
        {state === 'NORMAL' && (
          <>
            {/* Dark Aviator Sunglasses */}
            <rect x="10" y="13" width="5" height="4" fill="#000000" />
            <rect x="17" y="13" width="5" height="4" fill="#000000" />
            <rect x="15" y="14" width="2" height="1" fill="#000000" />
            {/* Glasses reflection */}
            <rect x="11" y="14" width="1" height="2" fill="#64748b" />
            <rect x="18" y="14" width="1" height="2" fill="#64748b" />
          </>
        )}

        {state === 'SCANNING' && (
          <>
            {/* Wide suspicious eyes */}
            <rect x="10" y="13" width="4" height="4" fill="#ffffff" />
            <rect x="18" y="13" width="4" height="4" fill="#ffffff" />
            <rect x="12" y="14" width="2" height="2" fill="#000000" />
            <rect x="19" y="14" width="2" height="2" fill="#000000" />
            {/* Magnifying Glass Overlay */}
            <circle cx="21" cy="15" r="4" fill="none" stroke="#06b6d4" strokeWidth="1" />
            <line x1="24" y1="18" x2="28" y2="22" stroke="#06b6d4" strokeWidth="2" />
          </>
        )}

        {state === 'SHOCKED' && (
          <>
            {/* Wide shocked white eyes + Sweat Drop */}
            <rect x="10" y="12" width="4" height="5" fill="#ffffff" />
            <rect x="18" y="12" width="4" height="5" fill="#ffffff" />
            <rect x="11" y="14" width="2" height="2" fill="#ef4444" />
            <rect x="19" y="14" width="2" height="2" fill="#ef4444" />
            {/* Exclamation Symbol above head */}
            <rect x="15" y="0" width="2" height="3" fill="#ef4444" />
            <rect x="15" y="4" width="2" height="1" fill="#ef4444" />
          </>
        )}

        {state === 'HAPPY' && (
          <>
            {/* Cheerful wink eyes */}
            <rect x="10" y="14" width="4" height="1" fill="#000000" />
            <rect x="18" y="13" width="4" height="3" fill="#ffffff" />
            <rect x="19" y="14" width="2" height="2" fill="#10b981" />
            {/* Star celebration above */}
            <rect x="25" y="2" width="3" height="3" fill="#eab308" />
          </>
        )}

        {state === 'CONFUSED' && (
          <>
            {/* Confused eyes + Question mark */}
            <rect x="10" y="13" width="4" height="3" fill="#ffffff" />
            <rect x="18" y="13" width="4" height="3" fill="#ffffff" />
            <rect x="11" y="14" width="1" height="1" fill="#000000" />
            <rect x="20" y="14" width="1" height="1" fill="#000000" />
            {/* Question Mark */}
            <path d="M 26 2 Q 28 2 28 4 Q 28 6 26 7 L 26 8 M 26 10 L 26 11" fill="none" stroke="#f59e0b" strokeWidth="1" />
          </>
        )}

        {/* FAMOUS MALAYALAM MOUSTACHE (MEESA) */}
        <rect x="10" y="18" width="12" height="3" fill="#0f172a" />
        <rect x="8" y="19" width="3" height="3" fill="#0f172a" />
        <rect x="21" y="19" width="3" height="3" fill="#0f172a" />

        {/* MOUTH */}
        {state === 'SHOCKED' ? (
          <rect x="14" y="21" width="4" height="3" fill="#7f1d1d" />
        ) : state === 'HAPPY' ? (
          <rect x="13" y="21" width="6" height="2" fill="#10b981" />
        ) : (
          <rect x="14" y="21" width="4" height="1" fill="#451a03" />
        )}

        {/* UNIFORM SHIRT */}
        <rect x="9" y="22" width="14" height="8" fill="#d97706" />
        <rect x="13" y="22" width="6" height="8" fill="#b45309" />
        {/* Buttons / Badges */}
        <rect x="15" y="24" width="2" height="1" fill="#fef08a" />
        <rect x="15" y="27" width="2" height="1" fill="#fef08a" />
        <rect x="10" y="23" width="3" height="2" fill="#1e293b" />
      </svg>
    </div>
  );
};
