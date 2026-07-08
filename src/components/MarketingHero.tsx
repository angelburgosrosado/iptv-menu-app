import * as React from 'react';
import { motion } from 'motion/react';
import { Play, UploadCloud, Crown, Sparkles, Activity, Tv, Smartphone } from 'lucide-react';

interface MarketingHeroProps {
  onLaunchSimulator: () => void;
  onUploadM3u: () => void;
  onViewPricing: () => void;
}

export default function MarketingHero({
  onLaunchSimulator,
  onUploadM3u,
  onViewPricing
}: MarketingHeroProps) {
  return (
    <div className="relative w-full bg-zinc-950/40 rounded-[32px] border border-white/15 p-5 sm:p-8 md:p-12 lg:p-16 overflow-hidden flex flex-col gap-6 md:gap-8 items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      
      {/* Stacked Radial-Gradient Mesh Hero Background with Mix-Blend-Mode Screen */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{ mixBlendMode: 'screen' }}
      >
        <div 
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.45) 0%, transparent 45%),
              radial-gradient(circle at 85% 80%, rgba(29, 78, 216, 0.45) 0%, transparent 45%),
              radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.35) 0%, transparent 60%),
              radial-gradient(circle at 75% 25%, rgba(147, 197, 253, 0.25) 0%, transparent 35%)
            `,
            filter: 'blur(40px)'
          }}
        />
      </div>

      {/* Hero Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-400 select-none shadow-[0_0_15px_rgba(59,130,246,0.1)]"
      >
        <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
        IPTV Developer Suite
      </motion.div>

      {/* Headline & Subtext */}
      <div className="relative z-10 max-w-3xl flex flex-col gap-3 sm:gap-4">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight select-text"
        >
          The Developer Portal for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 drop-shadow-[0_2px_15px_rgba(59,130,246,0.15)]">Global IPTV Builders</span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xs sm:text-sm md:text-base lg:text-lg text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed select-text"
        >
          Clean playlists. Branded apps. Live EPG. One platform.
        </motion.p>
      </div>

      {/* Three CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 w-full max-w-xl flex flex-col xs:flex-row sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-center mt-2 px-2"
      >
        {/* Launch Simulator CTA */}
        <button
          onClick={onLaunchSimulator}
          className="group relative px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-white/10"
        >
          <Play className="w-4 h-4 fill-current text-white group-hover:scale-110 transition-transform" />
          <span>Launch Simulator</span>
        </button>

        {/* Upload M3U CTA */}
        <button
          onClick={onUploadM3u}
          className="group px-5 py-3 bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-white/10"
        >
          <UploadCloud className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:scale-110 transition-transform" />
          <span>Upload M3U</span>
        </button>

        {/* View Pricing CTA */}
        <button
          onClick={onViewPricing}
          className="group px-5 py-3 bg-zinc-900/60 hover:bg-zinc-800/80 text-amber-400 hover:text-amber-300 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-500/20 shadow-lg shadow-amber-500/5"
        >
          <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>View Pricing</span>
        </button>
      </motion.div>

      {/* Animated Stats Ticker (Smooth Continuous Scrolling Marquee) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 w-full mt-4"
      >
        <div className="relative w-full overflow-hidden py-3.5 bg-blue-500/5 border border-white/10 rounded-2xl">
          {/* Edge Fades for a polished look */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-950/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-950/80 to-transparent z-10 pointer-events-none" />
          
          <motion.div 
            className="flex gap-16 w-max select-none text-[10px] sm:text-xs font-extrabold font-mono tracking-widest text-blue-400"
            animate={{ x: [0, -320] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 16,
            }}
          >
            {/* Ticker Batch 1 */}
            <div className="flex gap-16 items-center flex-shrink-0">
              <span className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                1,497+ Free Channels
              </span>
              <span className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                60 FPS Streaming
              </span>
              <span className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                M3U Auto-Clean
              </span>
            </div>
            
            {/* Ticker Batch 2 */}
            <div className="flex gap-16 items-center flex-shrink-0">
              <span className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                1,497+ Free Channels
              </span>
              <span className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                60 FPS Streaming
              </span>
              <span className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                M3U Auto-Clean
              </span>
            </div>

            {/* Ticker Batch 3 (To ensure perfect wrapping buffer) */}
            <div className="flex gap-16 items-center flex-shrink-0">
              <span className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                1,497+ Free Channels
              </span>
              <span className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                60 FPS Streaming
              </span>
              <span className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                M3U Auto-Clean
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
