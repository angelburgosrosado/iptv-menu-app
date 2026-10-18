/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalShelfScrollProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function HorizontalShelfScroll({
  title,
  subtitle,
  icon,
  badge,
  onSeeAll,
  children,
  className = ''
}: HorizontalShelfScrollProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const scrollAmount = containerRef.current.clientWidth * 0.75;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className={`relative my-6 ${className}`}>
      {/* Shelf Header */}
      <div className="flex items-end justify-between mb-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-[#7c5cff] shrink-0">{icon}</div>}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#eef0f6]">
                {title}
              </h3>
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-[#7c5cff]/20 text-[#7c5cff] border border-[#7c5cff]/30 text-[10px] font-bold uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-[#9aa0b3] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-xs font-semibold text-[#00e0c6] hover:text-white transition-colors cursor-pointer mr-2"
            >
              See all
            </button>
          )}

          {/* Left Arrow Button */}
          <button
            type="button"
            disabled={!canScrollLeft}
            onClick={() => scroll('left')}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              canScrollLeft
                ? 'bg-[#181c27] text-white hover:bg-[#7c5cff] border border-white/10 cursor-pointer shadow-sm'
                : 'bg-white/5 text-white/20 border border-transparent cursor-default'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            disabled={!canScrollRight}
            onClick={() => scroll('right')}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              canScrollRight
                ? 'bg-[#181c27] text-white hover:bg-[#7c5cff] border border-white/10 cursor-pointer shadow-sm'
                : 'bg-white/5 text-white/20 border border-transparent cursor-default'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Shelf */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className="flex items-center gap-4 overflow-x-auto px-4 sm:px-6 py-2 scrollbar-hide tv-shelf-scroll"
      >
        {children}
      </div>
    </section>
  );
}

export default HorizontalShelfScroll;
