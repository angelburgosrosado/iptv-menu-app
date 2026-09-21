import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  Mail, 
  Check, 
  XCircle, 
  Loader2, 
  Sparkles, 
  ShieldAlert, 
  Crown, 
  ArrowRight,
  TrendingUp,
  Tv,
  Cpu
} from 'lucide-react';
import { authStore } from '../authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (msg: string) => void;
}

export default function AuthModal({ isOpen, onClose, triggerToast }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      let user;
      if (isSignUp) {
        user = await authStore.register(email, password);
      } else {
        user = await authStore.login(email, password);
      }
      
      if (typeof window !== 'undefined' && window.dataLayer && isSignUp) {
        window.dataLayer.push({
          event: 'User_Sign_Up',
          method: 'Email'
        });
      }
      
      setIsLoading(false);
      setEmail('');
      setPassword('');
      
      const roleMsg = user.role === 'admin' ? 'Root Admin Active (Angel Burgos)' : 'Welcome back! Premium Active';
      triggerToast(roleMsg);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Ambient backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window Container (Centered Dialog on Desktop, Full-Screen Bottom Sheet on Mobile) */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full h-[92vh] sm:h-auto sm:max-w-2xl bg-zinc-950 border-t sm:border border-x sm:border-y border-white/10 rounded-t-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(59,130,246,0.3)] z-10 flex flex-col md:flex-row overflow-y-auto md:overflow-y-visible"
        >
          {/* Bottom Sheet Native Drag Handle (Visible only on Mobile) */}
          <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mt-3 mb-1 sm:hidden block flex-shrink-0" />

          {/* Neon blue ambient background flare inside modal */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer z-20 border border-white/5"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Panel: Form & Identity Inputs */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between gap-6 border-b md:border-b-0 md:border-r border-white/15 relative z-10">
            <div>
              {/* Badge header */}
              <div className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider text-blue-400 uppercase mb-4 animate-pulse">
                <Crown className="w-3 h-3 text-blue-400 fill-current" />
                IPTV Menu Cloud Account
              </div>

              <h3 className="text-xl font-extrabold text-white tracking-tight">
                {isSignUp ? 'Create Your Account' : 'Sign In to IPTV Menu'}
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                {isSignUp
                  ? 'Sign up to synchronize your M3U playlists, custom channels, and quad multi-screen view across devices.'
                  : 'Access your cloud-synced playlists, live channels, and streaming preferences.'}
              </p>

              {/* Error Banner */}
              {authError && (
                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Identity Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-4">
                
                {/* Float-Label Email field */}
                <div className="relative w-full">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none z-10">
                    <Mail className={`w-4 h-4 transition-colors ${emailFocused ? 'text-blue-400' : 'text-zinc-500'}`} />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className={`w-full bg-zinc-900/50 hover:bg-zinc-900/80 focus:bg-zinc-950 border rounded-xl pl-10 pr-4 py-4 text-xs text-white outline-none transition-all pt-5 font-bold ${
                      emailFocused ? 'border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : 'border-white/10'
                    }`}
                  />
                  <label className={`absolute left-10 transition-all duration-200 pointer-events-none font-bold ${
                    emailFocused || email 
                      ? 'top-1 text-[9px] text-blue-400 tracking-wider uppercase font-extrabold' 
                      : 'top-4 text-xs text-zinc-500'
                  }`}>
                    Email Address
                  </label>
                </div>

                {/* Float-Label Password field */}
                <div className="relative w-full">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none z-10">
                    <Lock className={`w-4 h-4 transition-colors ${passwordFocused ? 'text-blue-400' : 'text-zinc-500'}`} />
                  </div>
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className={`w-full bg-zinc-900/50 hover:bg-zinc-900/80 focus:bg-zinc-950 border rounded-xl pl-10 pr-4 py-4 text-xs text-white outline-none transition-all pt-5 font-bold ${
                      passwordFocused ? 'border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : 'border-white/10'
                    }`}
                  />
                  <label className={`absolute left-10 transition-all duration-200 pointer-events-none font-bold ${
                    passwordFocused || password 
                      ? 'top-1 text-[9px] text-blue-400 tracking-wider uppercase font-extrabold' 
                      : 'top-4 text-xs text-zinc-500'
                  }`}>
                    Password
                  </label>
                </div>

                {/* Simulated Sign In action */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-600/50 disabled:to-indigo-600/50 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 select-none border border-white/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignUp ? 'Create Free Account' : 'Sign In'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Toggle Sign Up / Sign In footer */}
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-[10px] font-bold text-zinc-400 hover:text-blue-400 transition-colors cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign In instead' : 'New to IPTV Menu? Create an account'}
              </button>
            </div>
          </div>

          {/* Right Panel: Free vs Premium Feature Comparison */}
          <div className="flex-1 p-6 sm:p-8 bg-zinc-900/40 relative z-10 flex flex-col justify-between gap-6">
            <div>
              <span className="text-[9px] font-black text-amber-400 tracking-widest uppercase block mb-1">
                STREAMING EXPERIENCE
              </span>
              <h4 className="text-sm font-black text-white">Compare Streaming Features</h4>
              <p className="text-[10px] text-zinc-500 mt-1 font-semibold">
                Unlock cloud playlist synchronization, multi-screen matrix, and automated stream health monitoring.
              </p>

              {/* Table / Grid list representing comparison */}
              <div className="flex flex-col gap-3 mt-5">
                
                {/* Feature 1 */}
                <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black text-zinc-400">
                    <span className="text-zinc-200">Stream Playlists</span>
                    <span className="text-amber-400">Pro Benefit</span>
                  </div>
                  <div className="flex items-center gap-4 justify-between mt-0.5 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <XCircle className="w-3.5 h-3.5 text-red-500/40" />
                      <span>1 active limit</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unlimited + Cloud Sync</span>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Multi-Screen View */}
                <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black text-zinc-400">
                    <span className="text-zinc-200">Quad Multi-Screen</span>
                    <span className="text-amber-400">Pro Benefit</span>
                  </div>
                  <div className="flex items-center gap-4 justify-between mt-0.5 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <XCircle className="w-3.5 h-3.5 text-red-500/40" />
                      <span>Single player</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>4 streams simultaneously</span>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Stream Health Checks */}
                <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black text-zinc-400">
                    <span className="text-zinc-200">Stream Health Checks</span>
                    <span className="text-amber-400">Pro Benefit</span>
                  </div>
                  <div className="flex items-center gap-4 justify-between mt-0.5 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <XCircle className="w-3.5 h-3.5 text-red-500/40" />
                      <span>Manual check</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Continuous auto-healing</span>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Live EPG Feed */}
                <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[10px] font-black text-zinc-400">
                    <span className="text-zinc-200">Live XMLTV EPG Feed</span>
                    <span className="text-amber-400">Pro Benefit</span>
                  </div>
                  <div className="flex items-center gap-4 justify-between mt-0.5 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <XCircle className="w-3.5 h-3.5 text-red-500/40" />
                      <span>Basic local</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Auto-matched TV schedule</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Note text footer */}
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <p className="text-[9px] text-zinc-400 leading-normal font-semibold">
                Sign in with your email to sync your streaming library across desktop and mobile devices.
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
