import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, 
  Cpu, 
  CpuIcon,
  HardDrive, 
  ShieldCheck, 
  ExternalLink, 
  TrendingUp, 
  Sliders, 
  Award, 
  Info, 
  Gamepad2, 
  Check, 
  CircleDot, 
  HelpCircle,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

import { PageProtocolHeader } from './PageProtocolHeader';

export type DeviceTier = 'all' | 'budget' | 'premium' | 'ultra';

export interface DeviceInfo {
  id: string;
  name: string;
  tier: 'budget' | 'premium' | 'ultra';
  performanceScore: string;
  compatibilityRating: string;
  compatPercentage: number;
  specs: {
    processor: string;
    ram: string;
    storage: string;
    os: string;
    video: string;
  };
  pros: string[];
  amazonUrl: string;
  icon: React.ComponentType<any>;
  accentColor: string;
}

export default function CertifiedDevices() {
  const [selectedTier, setSelectedTier] = React.useState<DeviceTier>('all');

  const devices: DeviceInfo[] = [
    {
      id: 'nvidia-shield-pro',
      name: 'Nvidia Shield TV Pro',
      tier: 'ultra',
      performanceScore: '9.8/10',
      compatibilityRating: '100% Native support. Perfect hardware decoding, Dolby Atmos/Vision, & AI 4K Upscaling.',
      compatPercentage: 100,
      specs: {
        processor: 'NVIDIA Tegra X1+ (AI Enhanced)',
        ram: '3GB LPDDR4X',
        storage: '16GB (Expandable)',
        os: 'Android TV 11 (Shield Experience)',
        video: '4K HDR, Dolby Vision, Dolby Atmos'
      },
      pros: [
        'Hardware deinterlacing for 1080i European satellite feeds',
        'Gigabit Ethernet prevents buffer underrun spikes',
        'Dolby TrueHD, DTS:X lossless audio pass-through'
      ],
      amazonUrl: 'https://www.amazon.com/s?k=NVIDIA+Shield+TV+Pro&tag=iptvmenu-20',
      icon: Tv,
      accentColor: 'from-emerald-500/10 to-teal-600/5'
    },
    {
      id: 'fire-tv-cube-3',
      name: 'Amazon Fire TV Cube (3rd Gen)',
      tier: 'ultra',
      performanceScore: '9.5/10',
      compatibilityRating: '96% Native support. Octa-core CPU, AV1 video decoding, & Wi-Fi 6E connectivity.',
      compatPercentage: 96,
      specs: {
        processor: 'Octa-Core (4x 2.2GHz, 4x 2.0GHz)',
        ram: '2GB LPDDR4X',
        storage: '16GB Storage',
        os: 'Fire OS 7 (Android 9/11 Base)',
        video: '4K Ultra HD, Dolby Vision, HDR10+, AV1'
      },
      pros: [
        'AV1 Hardware Decoding for next-gen low-bandwidth streams',
        'Super-resolution upscaling turns 720p feeds into sharp 4K',
        'HDMI passthrough to connect legacy cable boxes'
      ],
      amazonUrl: 'https://www.amazon.com/s?k=Amazon+Fire+TV+Cube+3rd+Gen&tag=iptvmenu-20',
      icon: Cpu,
      accentColor: 'from-blue-500/10 to-indigo-600/5'
    },
    {
      id: 'fire-tv-stick-4k-max',
      name: 'Amazon Fire TV Stick 4K Max',
      tier: 'premium',
      performanceScore: '9.1/10',
      compatibilityRating: '94% Native support. Quad-core 2.0GHz CPU, Wi-Fi 6E, & 16GB internal memory.',
      compatPercentage: 94,
      specs: {
        processor: 'Quad-core 2.0GHz',
        ram: '2GB RAM',
        storage: '16GB Storage',
        os: 'Fire OS 8',
        video: '4K Ultra HD, Dolby Vision, HDR10+'
      },
      pros: [
        'High value to performance benchmark ratio',
        'Wi-Fi 6E triband support for congested home routers',
        'Ambient Experience and quick app switching'
      ],
      amazonUrl: 'https://www.amazon.com/s?k=Amazon+Fire+TV+Stick+4K+Max&tag=iptvmenu-20',
      icon: HardDrive,
      accentColor: 'from-indigo-500/10 to-purple-600/5'
    },
    {
      id: 'chromecast-google-tv-4k',
      name: 'Chromecast with Google TV (4K)',
      tier: 'premium',
      performanceScore: '8.9/10',
      compatibilityRating: '92% Native support. Official Google Play Store & Leanback launcher ecosystem.',
      compatPercentage: 92,
      specs: {
        processor: 'Amlogic S905X3 Quad-Core',
        ram: '2GB RAM',
        storage: '8GB Storage',
        os: 'Google TV UI (Android TV 12)',
        video: '4K HDR10+, Dolby Vision, 60 FPS'
      },
      pros: [
        'Direct access to Play Store (Tivimate, Sparkle)',
        'Convenient personalized recommendations launcher',
        'Great voice control and remote integration'
      ],
      amazonUrl: 'https://www.amazon.com/s?k=Chromecast+with+Google+TV+4K&tag=iptvmenu-20',
      icon: Sparkles,
      accentColor: 'from-blue-500/10 to-indigo-600/5'
    },
    {
      id: 'walmart-onn-4k',
      name: 'Walmart Onn 4K Streaming Box',
      tier: 'budget',
      performanceScore: '8.1/10',
      compatibilityRating: '88% Compatibility. Standard Google TV software. Incredible entry-level pricing.',
      compatPercentage: 88,
      specs: {
        processor: 'Amlogic Quad-Core Processor',
        ram: '2GB RAM',
        storage: '8GB Storage',
        os: 'Google TV UI',
        video: '4K UHD, HDR10, Dolby Audio'
      },
      pros: [
        'Extremely low price with fully stock Google TV',
        'Standard hardware acceleration for H.264/H.265',
        'Minimalist remote control with TV controls'
      ],
      amazonUrl: 'https://www.amazon.com/s?k=Walmart+Onn+4K+Streaming+Box&tag=iptvmenu-20',
      icon: Package,
      accentColor: 'from-zinc-500/10 to-zinc-600/5'
    }
  ];

  const filteredDevices = selectedTier === 'all' 
    ? devices 
    : devices.filter(d => d.tier === selectedTier);

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Hardware Architecture Protocol Header */}
      <PageProtocolHeader
        title="Certified IPTV Streaming Hardware"
        description="Hardware decoder certification directory and benchmark validation index. Profiles SoC chipsets, hardware buffer depth, Widevine DRM compliance, and Android TV Leanback compatibility for jitter-free multi-stream decoding."
        protocol="Android TV Leanback & Widevine DRM"
        schema="Android MediaCodec SoC Profile & CTA-2072 Standard"
        rfcOrStandard="Google Cast v2 • CTA-2072 • ISO/IEC 23001-7"
        layer="Hardware Abstraction & MediaCodec Layer"
        supportedTags={['MediaCodec H.264/HEVC/AV1', 'Widevine L1/L3', 'ExoPlayer Tuner', 'Leanback UI', '4K 60FPS HDR']}
        icon={ShieldCheck}
        badgeColor="purple"
      />

      {/* Filter Segmented Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/40 p-2 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-2 px-1">
          <Sliders className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-400">Filter Hardware Tiers:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'budget', 'premium', 'ultra'] as DeviceTier[]).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                selectedTier === tier
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/5'
              }`}
            >
              {tier === 'all' ? 'All Tiers' : `${tier} Tier`}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDevices.map((device, index) => {
            const Icon = device.icon;
            return (
              <motion.div
                key={device.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className={`relative group bg-zinc-950/40 hover:bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-white/10 p-5 flex flex-col justify-between transition-all duration-300 overflow-hidden shadow-lg`}
              >
                {/* Glowing decorative backdrop */}
                <div className={`absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br ${device.accentColor} rounded-full blur-2xl opacity-60 pointer-events-none group-hover:scale-125 transition-transform duration-500`} />
                
                <div>
                  {/* Top Header Card Info */}
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      {/* Device category wrapper acting as responsive mockup */}
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-blue-400 group-hover:text-blue-300 group-hover:border-blue-500/20 transition-all flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white group-hover:text-blue-400 transition-colors leading-snug">
                          {device.name}
                        </h3>
                        <span className={`inline-block text-[8px] font-black tracking-widest uppercase mt-0.5 px-2 py-0.5 rounded ${
                          device.tier === 'ultra' 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : device.tier === 'premium'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                          {device.tier} tier
                        </span>
                      </div>
                    </div>

                    {/* Performance Score Badge */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-extrabold text-amber-400">
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>{device.performanceScore}</span>
                      </div>
                      <span className="text-[7px] font-black text-zinc-500 tracking-wider uppercase mt-1">
                        Perf Score
                      </span>
                    </div>
                  </div>

                  {/* Compatibility Progress bar */}
                  <div className="mb-4 bg-zinc-900/60 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 mb-1.5">
                      <span>IPTV Compatibility</span>
                      <span className="text-emerald-400">{device.compatPercentage}%</span>
                    </div>
                    {/* Tiny visual progress bar */}
                    <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                        style={{ width: `${device.compatPercentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal font-semibold mt-2 select-text">
                      {device.compatibilityRating}
                    </p>
                  </div>

                  {/* Key Specs Summary list */}
                  <div className="flex flex-col gap-2 mb-4 border-t border-white/5 pt-3">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      Hardware Profile Specs
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-zinc-400">
                      <div className="bg-zinc-900/30 p-1.5 rounded border border-white/5">
                        <span className="text-[8px] text-zinc-500 font-extrabold block uppercase tracking-wider mb-0.5">Processor</span>
                        <span className="text-zinc-300 font-bold truncate block">{device.specs.processor}</span>
                      </div>
                      <div className="bg-zinc-900/30 p-1.5 rounded border border-white/5">
                        <span className="text-[8px] text-zinc-500 font-extrabold block uppercase tracking-wider mb-0.5">RAM & Flash</span>
                        <span className="text-zinc-300 font-bold truncate block">{device.specs.ram} / {device.specs.storage}</span>
                      </div>
                      <div className="bg-zinc-900/30 p-1.5 rounded border border-white/5">
                        <span className="text-[8px] text-zinc-500 font-extrabold block uppercase tracking-wider mb-0.5">Operating Sys</span>
                        <span className="text-zinc-300 font-bold truncate block">{device.specs.os}</span>
                      </div>
                      <div className="bg-zinc-900/30 p-1.5 rounded border border-white/5">
                        <span className="text-[8px] text-zinc-500 font-extrabold block uppercase tracking-wider mb-0.5">Video Decoding</span>
                        <span className="text-zinc-300 font-bold truncate block">{device.specs.video}</span>
                      </div>
                    </div>
                  </div>

                  {/* Built-in pro pointers */}
                  <div className="mt-3 flex flex-col gap-1.5">
                    {device.pros.map((pro, pidx) => (
                      <div key={pidx} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <Check className="w-3 h-3 text-blue-500/70 flex-shrink-0" />
                        <span className="truncate">{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buy on Amazon Affiliate CTA with Orange styling */}
                <a
                  href={device.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 font-black rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-amber-500/20 hover:border-transparent select-none shadow-lg shadow-amber-500/5 group/btn"
                >
                  <span>Buy on Amazon</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </a>

              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Info & Disclaimer footer */}
      <div className="mt-4 p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-3">
        <Info className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-[11px] font-black text-zinc-300 uppercase tracking-wider">Affiliate Notice & Hardware Disclaimer</h4>
          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-1 select-text">
            Affiliate links support iptv.menu development. As an Amazon Associate, we earn from qualifying purchases at no additional expense to you. All streaming devices listed have been purchased independently and subjected to extensive testing using standard HLS and TS container streaming formats.
          </p>
        </div>
      </div>

    </div>
  );
}
