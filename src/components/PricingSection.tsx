import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Crown, Zap, Gift } from 'lucide-react';

interface PricingSectionProps {
  onSelectFree: () => void;
  onSelectPro: () => void;
  onSelectBuilder: () => void;
}

export default function PricingSection({
  onSelectFree,
  onSelectPro,
  onSelectBuilder
}: PricingSectionProps) {
  const [isYearly, setIsYearly] = React.useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for exploring and parsing individual stream links.',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        'M3U stream upload & parsing',
        'Cleaned M3U download files',
        '1 stream cleanup per day',
        'Standard player latency configuration',
        'Community forum support'
      ],
      cta: 'Get Started Free',
      icon: Zap,
      accent: 'zinc',
      onSelect: onSelectFree,
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro Streamer',
      description: 'Host, synchronize, and clean playlists automatically.',
      priceMonthly: 2.99,
      priceYearly: 1.99, // Billed as $23.88/yr
      features: [
        'Everything in Free tier',
        'Premium CDN hosting & auto-sync link',
        'Daily automatic stream cleanups',
        'Integrated EPG XMLTV auto-feed',
        'Optimized latency buffer settings',
        'Priority email support (24h response)'
      ],
      cta: 'Upgrade to Pro',
      icon: Sparkles,
      accent: 'blue',
      onSelect: onSelectPro,
      popular: true
    },
    {
      id: 'builder',
      name: 'App Builder',
      description: 'Launch your own white-label white-glove Android app.',
      priceMonthly: 19.99,
      priceYearly: 14.99, // Billed as $179.88/yr
      features: [
        'Everything in Pro tier',
        '1 Custom branded Android APK compilation',
        'Full brand customization suite',
        'White-label assets and colors builder',
        'No IPTV-Menu brand tags',
        '24/7 dedicated Developer Support'
      ],
      cta: 'Start Building Now',
      icon: Crown,
      accent: 'amber',
      onSelect: onSelectBuilder,
      popular: false
    }
  ];

  return (
    <div id="pricing-section" className="relative w-full bg-zinc-950/20 rounded-[32px] border border-white/5 p-6 sm:p-10 md:p-12 overflow-hidden flex flex-col items-center">
      
      {/* Background radial accent */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-30 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Header Info */}
      <div className="relative z-10 text-center max-w-2xl flex flex-col gap-3.5 mb-8">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full w-fit mx-auto shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          Simple Pricing
        </span>
        <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          Flexible Plans for Streams and Custom Brands
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 font-semibold leading-relaxed">
          Select a standard caching plan or unlock standalone custom Android APK compiler tools.
        </p>
      </div>

      {/* Monthly vs Yearly Toggle Switcher */}
      <div className="relative z-10 flex items-center gap-3 bg-zinc-900/60 p-1 border border-white/15 rounded-2xl mb-12 select-none">
        <button
          type="button"
          onClick={() => setIsYearly(false)}
          className={`relative px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer ${
            !isYearly ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setIsYearly(true)}
          className={`relative px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
            isYearly ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Yearly
          <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-black">
            SAVE 30%
          </span>
        </button>
      </div>

      {/* Pricing Grid */}
      <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl items-stretch">
        {plans.map((plan) => {
          const PlanIcon = plan.icon;
          const currentPrice = isYearly ? plan.priceYearly : plan.priceMonthly;
          const isFree = plan.priceMonthly === 0;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-[28px] p-6 transition-all duration-300 border bg-black/40 ${
                plan.popular 
                  ? 'border-blue-500/40 shadow-[0_20px_40px_rgba(59,130,246,0.1)] bg-zinc-950/60 scale-[1.02] md:scale-[1.03]'
                  : 'border-white/5 hover:border-white/10 shadow-lg'
              }`}
            >
              {/* Popular glow ring */}
              {plan.popular && (
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse" />
              )}

              {/* Top content & Badge */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${
                      plan.popular ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-zinc-900 text-zinc-400 border border-white/5'
                    }`}>
                      <PlanIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{plan.name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight font-semibold">{plan.description}</p>
                    </div>
                  </div>
                  
                  {plan.popular && (
                    <span className="text-[8px] font-black tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full animate-pulse">
                      MOST POPULAR
                    </span>
                  )}
                </div>

                {/* Price tag block with count value animations */}
                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">$</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={currentPrice}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="text-4xl font-extrabold text-white tracking-tight"
                      >
                        {isFree ? '0' : currentPrice.toFixed(2)}
                      </motion.span>
                    </AnimatePresence>
                    {!isFree && (
                      <span className="text-[10px] text-zinc-500 font-bold ml-1">/ month</span>
                    )}
                  </div>
                  {isYearly && !isFree && (
                    <p className="text-[9px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      Billed annually (${(currentPrice * 12).toFixed(2)}/yr)
                    </p>
                  )}
                  {isFree && (
                    <p className="text-[9px] text-zinc-500 font-semibold mt-1.5">Free forever</p>
                  )}
                </div>

                {/* Feature Bullet Checklist */}
                <div className="border-t border-white/5 pt-6 flex flex-col gap-3">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                    Features Included:
                  </span>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className={`p-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                        plan.popular ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-zinc-300 leading-normal font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing CTA Button */}
              <button
                type="button"
                onClick={plan.onSelect}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 mt-8 ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 border border-white/10'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/5'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
