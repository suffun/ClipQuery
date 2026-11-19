import React from 'react';

/**
 * Minimalist premium Mac-style app icon component.
 * Exact Apple macOS aesthetic:
 * - Soft off-white background (#F5F5F7)
 * - Rounded squircle (continuous curvature)
 * - Chat bubble in Apple System Blue (#007AFF)
 * - Three soft rounded dots inside
 * - Subtle geometric play triangle cleanly integrated on the right side
 */
export default function MacAppIcon({ size = 32, className = "" }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center flex-shrink-0 select-none ${className}`}
    >
      <svg
        viewBox="0 0 1024 1024"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
      >
        {/* Soft rounded macOS squircle */}
        <rect width="1024" height="1024" rx="224" ry="224" fill="#F5F5F7" />
        
        {/* Apple System Blue Chat Bubble */}
        <g>
          {/* Main Bubble Body */}
          <rect x="220" y="318" width="530" height="388" rx="170" ry="170" fill="#007AFF" />
          {/* Integrated Geometric Play Triangle on Right Side */}
          <polygon points="710,400 710,624 870,512" fill="#007AFF" />
        </g>

        {/* Three Soft Rounded White Dots */}
        <circle cx="400" cy="512" r="28" fill="#FFFFFF" />
        <circle cx="485" cy="512" r="28" fill="#FFFFFF" />
        <circle cx="570" cy="512" r="28" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

