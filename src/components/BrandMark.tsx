/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';

interface BrandMarkProps {
  size?: number; // size in Tailwind units or pixels
  className?: string;
  glow?: boolean;
}

export function BrandMark({ size = 9, className = '', glow = true }: BrandMarkProps) {
  const pixelSize = size * 4;
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5cff] via-[#6342e8] to-[#00e0c6] shadow-md ring-1 ring-white/20 select-none shrink-0 ${
        glow ? 'shadow-[#7c5cff]/30' : ''
      } ${className}`}
      style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      aria-label="IPTV.Menu Pro"
    >
      {/* Dynamic play triangle & signal curve icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/5 h-3/5 text-white drop-shadow"
      >
        <path
          d="M6 4.75V19.25C6 19.86 6.69 20.22 7.19 19.86L17.29 12.61C17.71 12.31 17.71 11.69 17.29 11.39L7.19 4.14C6.69 3.78 6 4.14 6 4.75Z"
          fill="currentColor"
        />
        <path
          d="M19 8C20.2 9.1 21 10.7 21 12.5C21 14.3 20.2 15.9 19 17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      </svg>
    </div>
  );
}

export default BrandMark;
