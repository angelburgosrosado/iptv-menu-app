import * as React from 'react';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import MarketingHero from '../components/MarketingHero';
import PricingSection from '../components/PricingSection';
import CertifiedDevices from '../components/CertifiedDevices';

interface PricingPageProps {
  onBackToPlayer: () => void;
  onOpenAuth: () => void;
}

export default function PricingPage({ onBackToPlayer, onOpenAuth }: PricingPageProps) {
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-10 py-6 px-4 sm:px-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToPlayer}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live TV Player</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Flexible Streaming Plans</span>
        </div>
      </div>

      {/* Hero Showcase */}
      <MarketingHero
        onBrowseChannels={onBackToPlayer}
        onLaunchSimulator={onBackToPlayer}
        onUploadM3u={onBackToPlayer}
        onViewPricing={() => {
          document.getElementById('pricing-tiers')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Pricing Cards Section */}
      <div id="pricing-tiers" className="scroll-mt-24">
        <PricingSection
          onSelectFree={onBackToPlayer}
          onSelectPro={onOpenAuth}
          onSelectBuilder={onOpenAuth}
        />
      </div>

      {/* Supported Devices */}
      <CertifiedDevices />
    </div>
  );
}
