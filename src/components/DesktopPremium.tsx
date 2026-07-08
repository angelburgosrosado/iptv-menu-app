import * as React from 'react';
import { Crown, Check, Sparkles, Zap, Award, Star } from 'lucide-react';
import { useAuth } from '../authStore';

interface DesktopPremiumProps {
  onTriggerAuth: () => void;
}

export default function DesktopPremium({ onTriggerAuth }: DesktopPremiumProps) {
  const auth = useAuth();
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = React.useState(false);

  const discountFactor = billingCycle === 'yearly' ? 0.8 : 1.0;

  const handleCheckout = (planName: string) => {
    if (!auth.isPremium) {
      onTriggerAuth();
    } else {
      setSelectedPlan(planName);
      setShowCheckoutSuccess(true);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500 fill-current animate-pulse" />
            IPTV Menu Premium Club
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Unlock absolute streaming power, deep EPG scheduling, global content syncing, and offline buffer caches.
          </p>
        </div>

        {/* Monthly/Yearly toggle with 20% discount indicator */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex bg-zinc-950/40 p-1 border border-white/10 rounded-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                billingCycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Yearly
              <span className="bg-amber-400/10 text-amber-400 text-[8px] font-extrabold px-1 py-0.5 rounded border border-amber-400/10">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Matrices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* Tier 1: Lite Player */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-all">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
              STANDARD PLAYER
            </span>
            <h3 className="text-base font-bold text-zinc-200">Lite Broadcast</h3>
            <p className="text-xs text-zinc-500 mt-1 leading-snug">
              Ideal for basic client-side stream testing and public country streams.
            </p>

            <div className="my-5 flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">$0</span>
              <span className="text-xs text-zinc-500 font-semibold">/forever</span>
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5">
              {[
                "Access to public fallback feeds",
                "Basic client M3U parser tool",
                "Up to 2 favorites streams saved",
                "Default 3.0s pre-fetch buffer"
              ].map((f, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <Check className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            disabled
            className="w-full py-2.5 px-4 rounded-xl border border-white/10 text-zinc-500 text-xs font-bold mt-6 cursor-not-allowed text-center"
          >
            Active Free Account
          </button>
        </div>

        {/* Tier 2: Pro Streamer (Popular option) */}
        <div className="bg-gradient-to-b from-blue-600/[0.05] to-transparent border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.1)] rounded-2xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border border-blue-400/20 shadow-md shadow-blue-500/20 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" /> MOST POPULAR
          </div>

          <div>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block mb-1 mt-1">
              POWER CONSUMER
            </span>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              Pro Streamer Suite
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-snug">
              Excellent for active entertainment buffs wanting premium features.
            </p>

            <div className="my-5 flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">
                ${(8.99 * discountFactor).toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500 font-semibold">/month</span>
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5">
              {[
                "Infinite custom M3U playlist URLs",
                "Full high-fidelity Electronic Program Guide",
                "Unlimited favorites & custom categories",
                "Custom 1.5s ultra-low latency buffer",
                "Cross-device mobile sandbox cloud-sync",
                "High performance list caching"
              ].map((f, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleCheckout("Pro Streamer Suite")}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold mt-6 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all text-center"
          >
            Upgrade to Pro Now
          </button>
        </div>

        {/* Tier 3: Broadcast Developer Enterprise */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-all">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
              COMMERCIAL / B2B BUILD
            </span>
            <h3 className="text-base font-bold text-zinc-200">Global Broadcast</h3>
            <p className="text-xs text-zinc-500 mt-1 leading-snug">
              Perfect for white-label app distributors and IPTV server hosters.
            </p>

            <div className="my-5 flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">
                ${(19.99 * discountFactor).toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500 font-semibold">/month</span>
            </div>

            <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5">
              {[
                "Everything included in Pro Streamer",
                "White-label mobile app binary builder",
                "Custom web proxy access for CORS bypass",
                "Full audio description & closed caption codecs",
                "24/7 dedicated server SLA monitoring",
                "API developer webhooks endpoints"
              ].map((f, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <Check className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleCheckout("Global Broadcast Suite")}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold mt-6 transition-all border border-white/10 text-center"
          >
            Purchase License
          </button>
        </div>

      </div>

      {/* Success Modal Simulation */}
      {showCheckoutSuccess && (
        <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 rounded-2xl border border-white/10 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/10 mb-4 animate-bounce">
            <Award className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">Purchase Activated!</h3>
          <p className="text-xs text-zinc-400 text-center max-w-sm mt-1.5 leading-relaxed font-semibold">
            Thank you for supporting <strong>iptv.menu</strong>. Your simulated payment for <span className="text-blue-400">{selectedPlan}</span> was processed instantly! Premium features are loaded onto your device context.
          </p>
          <button
            onClick={() => setShowCheckoutSuccess(false)}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg"
          >
            Proceed to Console
          </button>
        </div>
      )}

    </div>
  );
}
