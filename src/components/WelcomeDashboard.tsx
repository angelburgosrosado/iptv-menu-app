import React from 'react';
import MarketingHero from './MarketingHero';
import PricingSection from './PricingSection';

interface WelcomeDashboardProps {
  onBrowseChannels: () => void;
  onLaunchSimulator: () => void;
  onUploadM3u: () => void;
  onViewPricing: () => void;
  onSelectFree: () => void;
  onSelectPro: () => void;
  onSelectBuilder: () => void;
}

export default function WelcomeDashboard({
  onBrowseChannels,
  onLaunchSimulator,
  onUploadM3u,
  onViewPricing,
  onSelectFree,
  onSelectPro,
  onSelectBuilder
}: WelcomeDashboardProps) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-24 animate-in fade-in zoom-in-95 duration-500">
      <MarketingHero 
        onBrowseChannels={onBrowseChannels}
        onLaunchSimulator={onLaunchSimulator}
        onUploadM3u={onUploadM3u}
        onViewPricing={onViewPricing}
      />
      
      <div id="pricing-section">
        <PricingSection 
          onSelectFree={onSelectFree}
          onSelectPro={onSelectPro}
          onSelectBuilder={onSelectBuilder}
        />
      </div>
    </div>
  );
}
