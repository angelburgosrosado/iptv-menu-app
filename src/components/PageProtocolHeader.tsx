/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileCode, 
  Layers, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2,
  Cpu
} from 'lucide-react';

export interface PageProtocolHeaderProps {
  title: string;
  description: string;
  protocol: string;
  schema: string;
  rfcOrStandard?: string;
  layer?: string;
  supportedTags?: string[];
  icon?: React.ComponentType<{ className?: string }>;
  badgeColor?: 'blue' | 'emerald' | 'cyan' | 'indigo' | 'purple' | 'amber';
  children?: React.ReactNode;
}

export const PageProtocolHeader: React.FC<PageProtocolHeaderProps> = ({
  title,
  description,
  protocol,
  schema,
  rfcOrStandard,
  layer = 'Application & Presentation',
  supportedTags,
  icon: IconComponent = FileCode,
  badgeColor = 'blue',
  children
}) => {
  const colorMap = {
    blue: {
      border: 'border-blue-500/25',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      tagBg: 'bg-blue-500/15 text-blue-300 border-blue-500/20'
    },
    emerald: {
      border: 'border-emerald-500/25',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      tagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
    },
    cyan: {
      border: 'border-cyan-500/25',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      tagBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20'
    },
    indigo: {
      border: 'border-indigo-500/25',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
      tagBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
    },
    purple: {
      border: 'border-purple-500/25',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      tagBg: 'bg-purple-500/15 text-purple-300 border-purple-500/20'
    },
    amber: {
      border: 'border-amber-500/25',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      tagBg: 'bg-amber-500/15 text-amber-300 border-amber-500/20'
    }
  };

  const scheme = colorMap[badgeColor] || colorMap.blue;

  return (
    <div className={`w-full rounded-2xl border ${scheme.border} bg-black/40 backdrop-blur-xl p-4 md:p-5 flex flex-col gap-3.5 mb-6 relative overflow-hidden ${scheme.glow}`}>
      {/* Decorative gradient corner glow */}
      <div className={`absolute -right-16 -top-16 w-36 h-36 rounded-full ${scheme.bg} blur-3xl pointer-events-none`} />

      {/* Protocol & Schema Hierarchy Tag Bar */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wider ${scheme.border} ${scheme.bg} ${scheme.text}`}>
          <Layers className="w-3.5 h-3.5" />
          <span>Protocol: {protocol}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-zinc-300 font-mono font-semibold">
          <FileCode className="w-3.5 h-3.5 text-zinc-400" />
          <span>Schema: {schema}</span>
        </div>

        {rfcOrStandard && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 font-mono text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{rfcOrStandard}</span>
          </div>
        )}

        <div className="ml-auto hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-medium">
          <Cpu className="w-3 h-3 text-zinc-400" />
          <span>Layer: {layer}</span>
        </div>
      </div>

      {/* Title & Description Body */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border ${scheme.border} ${scheme.bg} ${scheme.text} flex-shrink-0 mt-0.5`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {title}
            </h2>
            <p className="text-xs md:text-sm text-zinc-300 font-normal leading-relaxed mt-1 max-w-3xl">
              {description}
            </p>
          </div>
        </div>

        {children && (
          <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto">
            {children}
          </div>
        )}
      </div>

      {/* Optional Specification Tags / Tokens */}
      {supportedTags && supportedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-1">
            Schema Tokens:
          </span>
          {supportedTags.map((tag) => (
            <span
              key={tag}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${scheme.tagBg}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageProtocolHeader;
